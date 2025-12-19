import { NextRequest, NextResponse } from 'next/server'
import { closeSignal, initDb } from '@/lib/db'
import { z } from 'zod'
import { addAudit } from '@/lib/audit'
import { readJson, writeJson } from '@/lib/store'

const closeSchema = z.object({
  result: z.enum(['WIN', 'LOSS', 'BREAK_EVEN', 'EXPIRED']),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const parsed = closeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid result' }, { status: 400 })
  }
  
  await initDb()
  await closeSignal(params.id, parsed.data.result)
  try {
    const signals = await readJson<any[]>('signals.json', [])
    const s = signals.find((x) => x.id === params.id)
    if (s) {
      s.status = 'CLOSED'
      s.result = parsed.data.result
      s.closedAt = new Date().toISOString()
      await writeJson('signals.json', signals)
    }
  } catch {}
  await addAudit('signal_close', { id: params.id, result: parsed.data.result })
  
  return NextResponse.json({ ok: true })
}
