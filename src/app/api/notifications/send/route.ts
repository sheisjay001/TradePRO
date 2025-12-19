import { NextResponse } from 'next/server'
import { readJson, writeJson } from '@/lib/store'

export async function POST() {
  const queue = await readJson<any[]>('notifications.json', [])
  if (queue.length === 0) return NextResponse.json({ ok: true, sent: 0 })
  const sent = await readJson<any[]>('notifications_sent.json', [])
  const batch = queue.splice(0, Math.min(queue.length, 100))
  sent.push(...batch.map((n) => ({ ...n, sentAt: new Date().toISOString() })))
  await writeJson('notifications.json', queue)
  await writeJson('notifications_sent.json', sent)
  return NextResponse.json({ ok: true, sent: batch.length, remaining: queue.length })
}
