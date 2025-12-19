import { NextResponse } from 'next/server'
import { initDb, getPool } from '@/lib/db'

export async function GET() {
  const ok = await initDb()
  const p = getPool()
  if (!p) {
    return NextResponse.json({ ok: false, error: 'No database connection. Check .env.local' }, { status: 500 })
  }
  try {
    const [uRows] = await p.query('SELECT COUNT(*) AS cnt FROM users')
    const [sRows] = await p.query('SELECT COUNT(*) AS cnt FROM signals')
    const [aRows] = await p.query('SELECT COUNT(*) AS cnt FROM admins')
    const usersCount = (uRows as any[])[0]?.cnt ?? 0
    const signalsCount = (sRows as any[])[0]?.cnt ?? 0
    const adminsCount = (aRows as any[])[0]?.cnt ?? 0
    return NextResponse.json({ ok, usersCount, adminsCount, signalsCount })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
