import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { findUserByEmail } from '@/lib/db'
import { readJson, writeJson } from '@/lib/store'
import crypto from 'crypto'

const schema = z.object({
  email: z.string().email(),
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
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const email = parsed.data.email
  const user = await findUserByEmail(email)

  // Always return success to prevent email enumeration, unless dev mode
  if (!user) {
    // Fake delay to mimic processing
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ ok: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 3600000 // 1 hour

  const resets = await readJson<ResetToken[]>('password_resets.json', [])
  
  // Remove old tokens for this email
  const newResets = resets.filter(r => r.email !== email && r.expiresAt > Date.now())
  
  newResets.push({ email, token, expiresAt })
  
  await writeJson('password_resets.json', newResets)

  // In a real app, send email here.
  // For this environment, we'll log it to console so the user can see it in Render logs.
  console.log(`[AUTH] Password reset link for ${email}: /reset-password/${token}`)

  return NextResponse.json({ ok: true })
}
