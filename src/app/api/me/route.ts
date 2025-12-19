import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getAppSecret } from '@/lib/config'

export const runtime = 'nodejs'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('tspro_token')?.value
  if (!token) return NextResponse.json({ user: null })
  const secret = getAppSecret()
  try {
    const payload = jwt.verify(token, secret) as any
    return NextResponse.json({ user: { id: payload.sub, email: payload.email, role: payload.role } })
  } catch {
    return NextResponse.json({ user: null })
  }
}
