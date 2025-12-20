import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import { readJson, writeJson } from './store'

type Role = 'user' | 'admin'
export type DbUser = { id: string; email: string; passwordHash: string; role: Role }
export type DbSignal = {
  id: string
  type: 'BUY' | 'SELL'
  market: 'FOREX' | 'CRYPTO' | 'INDICES'
  symbol: string
  entry: number
  stopLoss: number
  takeProfit: number | number[]
  expiresAt: string
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED'
  result?: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'EXPIRED'
  closedAt?: string
  createdAt: string
}

function hasDbEnv() {
  return !!process.env.DB_HOST && !!process.env.DB_USER && !!process.env.DB_PASS && !!process.env.DB_NAME
}

let pool: mysql.Pool | null = null
export function getPool(): mysql.Pool | null {
  if (!hasDbEnv()) return null
  if (!pool) {
    // Sanitize DB_HOST if user accidentally included port
    const host = process.env.DB_HOST?.split(':')[0]

    pool = mysql.createPool({
      host: host,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      ssl: {
        rejectUnauthorized: false
      },
      connectionLimit: 5,
      waitForConnections: true,
    })
  }
  return pool
}

let isInitialized = false

export async function initDb(): Promise<boolean> {
  if (isInitialized) return true

  const adminEmail = 'admin@tradesignal.pro'
  const adminPass = 'admin123'

  // Always ensure admin exists in JSON (fallback)
  try {
    const jsonUsers = await readJson<DbUser[]>('users.json', [])
    const jsonAdmin = jsonUsers.find((u) => u.email === adminEmail)
    if (!jsonAdmin) {
      const hash = await bcrypt.hash(adminPass, 10)
      jsonUsers.push({ id: 'admin-seed-id', email: adminEmail, passwordHash: hash, role: 'admin' })
      await writeJson('users.json', jsonUsers)
    } else if (jsonAdmin.role !== 'admin') {
      jsonAdmin.role = 'admin'
      await writeJson('users.json', jsonUsers)
    }
  } catch (e) {
    console.error('Failed to seed JSON admin:', e)
  }

  const p = getPool()
  if (!p) return false
  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(16) NOT NULL
      );
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL
      );
    `)
    await p.query(`
      CREATE TABLE IF NOT EXISTS signals (
        id VARCHAR(64) PRIMARY KEY,
        type VARCHAR(8) NOT NULL,
        market VARCHAR(16) NOT NULL,
        symbol VARCHAR(64) NOT NULL,
        entry DOUBLE NOT NULL,
        stop_loss DOUBLE NOT NULL,
        take_profit TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        status VARCHAR(16) NOT NULL,
        result VARCHAR(16),
        closed_at DATETIME,
        created_at DATETIME NOT NULL
      );
    `)
  } catch {}

  // Attempt to add columns if they don't exist (migration for existing tables)
  try {
    await p.query(`ALTER TABLE signals ADD COLUMN result VARCHAR(16)`)
  } catch {}
  try {
    await p.query(`ALTER TABLE signals ADD COLUMN closed_at DATETIME`)
  } catch {}

  // Seed default admin if not exists
  try {
    const [existingAdmin] = await p.query('SELECT id, password_hash, role FROM users WHERE email="admin@tradesignal.pro" LIMIT 1')
    const adminUser = (existingAdmin as any[])[0]
    if (!adminUser) {
      const hash = await bcrypt.hash(adminPass, 10)
      await p.query('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)', [
        'admin-seed-id',
        'admin@tradesignal.pro',
        hash,
        'admin'
      ])
    } else {
      if (adminUser.role !== 'admin') {
        await p.query('UPDATE users SET role="admin" WHERE id=?', [adminUser.id])
      }
      if (!adminUser.password_hash.startsWith('$2')) {
        const hash = await bcrypt.hash(adminPass, 10)
        await p.query('UPDATE users SET password_hash=? WHERE id=?', [hash, adminUser.id])
      }
    }
    const [admRows] = await p.query('SELECT id FROM admins WHERE email=? LIMIT 1', [adminEmail])
    const adm = (admRows as any[])[0]
    if (!adm) {
      const [pwRows] = await p.query('SELECT password_hash FROM users WHERE email=? LIMIT 1', [adminEmail])
      const pw = (pwRows as any[])[0]?.password_hash || (await bcrypt.hash(adminPass, 10))
      await p.query('INSERT INTO admins (id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())', [
        'admin-seed-id',
        adminEmail,
        pw,
      ])
    }
  } catch {}

  isInitialized = true
  return true
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const p = getPool()
  if (!p) return null
  try {
    const [rows] = await p.query('SELECT id, email, password_hash AS passwordHash, role FROM users WHERE email=? LIMIT 1', [email])
    const r = (rows as any[])[0]
    return r ? (r as DbUser) : null
  } catch {
    return null
  }
}

export async function createUser(u: DbUser): Promise<void> {
  const p = getPool()
  if (!p) throw new Error('No database connection')
  await p.query('INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)', [u.id, u.email, u.passwordHash, u.role])
}

export async function listSignals(): Promise<DbSignal[]> {
  const p = getPool()
  if (!p) return []
  try {
    const [rows] = await p.query('SELECT id, type, market, symbol, entry, stop_loss AS stopLoss, take_profit AS takeProfit, expires_at AS expiresAt, status, result, closed_at AS closedAt, created_at AS createdAt FROM signals ORDER BY created_at DESC LIMIT 100')
    return (rows as any[]).map((r) => {
      let tp: number | number[]
      try {
        const parsed = JSON.parse(r.takeProfit)
        tp = parsed
      } catch {
        tp = Number(r.takeProfit)
      }
      return { ...r, takeProfit: tp } as DbSignal
    })
  } catch (e) {
    console.error('DB listSignals error:', e)
    return []
  }
}

export async function closeSignal(id: string, result: string): Promise<void> {
  const p = getPool()
  if (!p) throw new Error('No database connection')
  await p.query('UPDATE signals SET status=?, result=?, closed_at=NOW() WHERE id=?', ['CLOSED', result, id])
}

export async function insertSignal(s: Omit<DbSignal, 'createdAt' | 'result' | 'closedAt'>): Promise<void> {
  const p = getPool()
  if (!p) throw new Error('No database connection')
  const tp = JSON.stringify(s.takeProfit)
  await p.query(
    'INSERT INTO signals (id, type, market, symbol, entry, stop_loss, take_profit, expires_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [s.id, s.type, s.market, s.symbol, s.entry, s.stopLoss, tp, s.expiresAt, s.status]
  )
}
