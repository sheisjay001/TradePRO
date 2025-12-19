import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { readJson } from '@/lib/store'
import { getAppSecret } from '@/lib/config'
import { findUserByEmail, initDb } from '@/lib/db'
import { addAudit } from '@/lib/audit'

type User = { id: string, email: string, passwordHash: string, role: 'user' | 'admin' }

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  await initDb()
  let user = await findUserByEmail(parsed.data.email)
  if (!user) {
    const users = await readJson<User[]>('users.json', [] as User[])
    user = users.find((u) => u.email === parsed.data.email) || null
  }
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  const secret = getAppSecret()
  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, secret, { expiresIn: '7d' })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('tspro_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
  await addAudit('login', { email: user.email }, user.id)
  return res
}
