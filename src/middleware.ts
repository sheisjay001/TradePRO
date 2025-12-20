import { NextRequest, NextResponse } from 'next/server'

const rateMap = new Map<string, { count: number; ts: number }>()
const LIMIT = Number(process.env.REQUESTS_PER_MINUTE || 60)

export function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const proto = req.headers.get('x-forwarded-proto')
  if (process.env.ENFORCE_HTTPS === 'true' && proto && proto !== 'https') {
    url.protocol = 'https:'
    return NextResponse.redirect(url.toString(), 301)
  }

  if (url.pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('tspro_token')?.value
    if (!token) {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (url.pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for') || 'local'
    const key = `${ip}:${url.pathname}`
    const now = Date.now()
    const windowStart = Math.floor(now / 60000) * 60000
    const rec = rateMap.get(key)
    if (!rec || rec.ts !== windowStart) {
      rateMap.set(key, { count: 1, ts: windowStart })
    } else {
      rec.count += 1
      if (rec.count > LIMIT) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      }
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}
