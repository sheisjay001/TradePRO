import { NextResponse } from 'next/server'
import { getPool, initDb } from '@/lib/db'
import { readJson } from '@/lib/store'

export async function GET() {
  await initDb()
  const p = getPool()
  let users = 0
  let signals = 0
  let admins = 0
  try {
    if (p) {
      const [u] = await p.query('SELECT COUNT(*) AS c FROM users')
      const [s] = await p.query('SELECT COUNT(*) AS c FROM signals')
      const [a] = await p.query('SELECT COUNT(*) AS c FROM admins')
      users = (u as any[])[0]?.c ?? 0
      signals = (s as any[])[0]?.c ?? 0
      admins = (a as any[])[0]?.c ?? 0
    } else {
      const uu = await readJson<any[]>('users.json', [])
      const ss = await readJson<any[]>('signals.json', [])
      users = uu.length
      signals = ss.length
      admins = uu.filter((x) => x.role === 'admin').length
    }
  } catch {}
  const audits = await readJson<any[]>('audit.json', [])
  const notifs = await readJson<any[]>('notifications.json', [])
  return NextResponse.json({
    users,
    admins,
    signals,
    audits: audits.length,
    notificationsQueued: notifs.length,
  })
}
