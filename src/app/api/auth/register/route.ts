import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { readJson, writeJson } from '@/lib/store'
import { createUser, findUserByEmail, initDb } from '@/lib/db'
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
  const dbUser = await findUserByEmail(parsed.data.email)
  if (dbUser) return NextResponse.json({ error: 'User already exists' }, { status: 409 })

  const jsonUsers = await readJson<User[]>('users.json', [] as User[])
  if (jsonUsers.find((u) => u.email === parsed.data.email)) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }

  const hash = await bcrypt.hash(parsed.data.password, 10)
  const newUser: User = { id: Date.now().toString(), email: parsed.data.email, passwordHash: hash, role: 'user' }
  try {
    await createUser(newUser)
  } catch {
    const users = await readJson<User[]>('users.json', [] as User[])
    users.push(newUser)
    await writeJson('users.json', users)
  }
  await addAudit('register', { email: newUser.email }, newUser.id)
  return NextResponse.json({ ok: true })
}
