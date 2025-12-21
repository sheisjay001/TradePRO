import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findUserByEmail, updateUserPassword } from '@/lib/db'
import { readJson, writeJson } from '@/lib/store'
import bcrypt from 'bcryptjs'

const schema = z.object({
  token: z.string(),
  password: z.string().min(8),
})

type ResetToken = {
  email: string
  token: string
  expiresAt: number
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { token, password } = parsed.data
  
  const resets = await readJson<ResetToken[]>('password_resets.json', [])
  const resetRecord = resets.find(r => r.token === token)

  if (!resetRecord) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  if (Date.now() > resetRecord.expiresAt) {
    // Clean up expired
    const newResets = resets.filter(r => r.token !== token)
    await writeJson('password_resets.json', newResets)
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  const user = await findUserByEmail(resetRecord.email)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  
  try {
    await updateUserPassword(resetRecord.email, hash)
    
    // Also update users.json if it exists (fallback)
    // We do this by reading, updating, and writing back
    // But given the DB is the source of truth, we might skip this if users.json is just a seed.
    // However, the `store.ts` suggests it might be used.
    // Let's check `store.ts` content to be safe. 
    // Actually, `createUser` only writes to DB in `db.ts`, so `users.json` might be irrelevant for live data if DB is active.
    // I'll stick to DB update.
    
    // Remove used token
    const newResets = resets.filter(r => r.token !== token)
    await writeJson('password_resets.json', newResets)
    
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }
}
