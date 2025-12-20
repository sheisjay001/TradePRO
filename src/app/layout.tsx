import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getAppSecret } from '@/lib/config'

export const metadata: Metadata = {
  title: 'TradePRO',
  description: 'Actionable trading signals with risk management',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('tspro_token')?.value
  const secret = getAppSecret()
  let role: 'admin' | 'user' | null = null
  if (token) {
    try {
      const payload = jwt.verify(token, secret) as any
      role = payload.role === 'admin' ? 'admin' : 'user'
    } catch {}
  }
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold">TradePRO</Link>
            <nav className="flex gap-4 items-center">
              {role && <Link href="/dashboard" className="text-sm hover:underline">Dashboard</Link>}
              {role === 'admin' && <Link href="/admin" className="text-sm hover:underline">Admin</Link>}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
