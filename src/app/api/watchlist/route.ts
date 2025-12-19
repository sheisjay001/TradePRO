import { NextRequest, NextResponse } from 'next/server'
import { readJson, writeJson } from '@/lib/store'

export async function GET() {
  const list = await readJson<string[]>('watchlist.json', [])
  return NextResponse.json({ watchlist: list })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const symbol = typeof body.symbol === 'string' ? body.symbol.toUpperCase() : null
  if (!symbol) return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 })
  const list = await readJson<string[]>('watchlist.json', [])
  if (!list.includes(symbol)) list.push(symbol)
  await writeJson('watchlist.json', list)
  return NextResponse.json({ ok: true, watchlist: list })
}

export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const symbol = url.searchParams.get('symbol')
  const list = await readJson<string[]>('watchlist.json', [])
  const filtered = list.filter((s) => s !== symbol)
  await writeJson('watchlist.json', filtered)
  return NextResponse.json({ ok: true, watchlist: filtered })
}
