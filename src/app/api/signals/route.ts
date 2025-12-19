import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { readJson, writeJson } from '@/lib/store'
import { validateSignalRisk } from '@/lib/risk'
import { getRiskConfig } from '@/lib/config'
import { initDb, listSignals as dbListSignals, insertSignal as dbInsertSignal } from '@/lib/db'
import { addAudit } from '@/lib/audit'
import { notifySignalToAllUsers } from '@/lib/notifications'

type Signal = {
  id: string
  type: 'BUY' | 'SELL'
  market: 'FOREX' | 'CRYPTO' | 'INDICES'
  symbol: string
  entry: number
  stopLoss: number
  takeProfit: number | number[]
  expiresAt: string
  status: 'ACTIVE' | 'INACTIVE'
}

const signalSchema = z.object({
  type: z.enum(['BUY', 'SELL']),
  market: z.enum(['FOREX', 'CRYPTO', 'INDICES']),
  symbol: z.string().min(1),
  entry: z.number().positive(),
  stopLoss: z.number().positive(),
  takeProfit: z.union([z.number().positive(), z.array(z.number().positive()).nonempty()]),
  expiresAt: z.string().datetime(),
})

export async function GET() {
  await initDb()
  let signalsAny: any[] = await dbListSignals()
  if (!signalsAny || signalsAny.length === 0) {
    signalsAny = await readJson<Signal[]>('signals.json', [] as Signal[])
  }
  return NextResponse.json({ signals: signalsAny })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = signalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const config = await getRiskConfig()

  const riskOk = validateSignalRisk(parsed.data, config.minRR)
  if (!riskOk) {
    return NextResponse.json({ error: 'Signal rejected: risk criteria not met' }, { status: 422 })
  }

  await initDb()
  let signalsAny: any[] = await dbListSignals()
  if (!signalsAny) signalsAny = []
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const todaysCount = signalsAny.filter((s) => {
    const created = (s as any).createdAt ? new Date((s as any).createdAt).getTime() : 0
    return created >= start
  }).length
  if (todaysCount >= config.dailyLimit) {
    return NextResponse.json({ error: 'Daily signal limit reached' }, { status: 429 })
  }
  const id = Date.now().toString()
  const newSignal: any = { id, status: 'ACTIVE', createdAt: new Date().toISOString(), ...parsed.data }
  try {
    await dbInsertSignal(newSignal as any)
  } catch {
    const jsonSignals = await readJson<any[]>('signals.json', [])
    jsonSignals.push(newSignal)
    await writeJson('signals.json', jsonSignals)
  }
  await addAudit('signal_create', { symbol: newSignal.symbol, type: newSignal.type, id })
  await notifySignalToAllUsers(newSignal as any)
  return NextResponse.json({ ok: true, id })
}
