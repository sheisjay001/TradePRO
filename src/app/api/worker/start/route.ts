import { NextResponse } from 'next/server'
import { startAutoWorker, getWorkerState } from '@/lib/worker'

export async function POST() {
  const res = await startAutoWorker()
  const state = await getWorkerState()
  return NextResponse.json({ ok: true, worker: res, state })
}
