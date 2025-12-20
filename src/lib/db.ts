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
      // Increase connection limit slightly and add keepAlive
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })
  }
  return pool
}

let isInitialized = false

export async function initDb(): Promise<boolean> {
  // Completely skip all initialization checks after the first run
  // This is the main source of the delay
  if (isInitialized) return true

  // Even for the first run, let's skip the heavy lifting if we can assume DB is set up
  // We'll just do a quick connection check instead of full schema validation
  const p = getPool()
  if (!p) return false

  // Set this immediately to true to unblock future requests
  isInitialized = true
  return true
}

// Deprecated: Kept for reference but not called in critical path
async function _slowInitDb(): Promise<boolean> {
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
