import { NextRequest } from 'next/server'
import { readJson } from '@/lib/store'
import { initDb, listSignals as dbListSignals } from '@/lib/db'
import { scanAndMaybeGenerate } from '@/lib/auto'
import { startAutoWorker } from '@/lib/worker'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Ensure worker is running
  startAutoWorker().catch(console.error)

  const url = new URL(req.url)
  const lastId = url.searchParams.get('lastId')
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: any) {
        if (closed) return
        try {
            controller.enqueue(encoder.encode(`event: ${event}\n`))
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (e) {
            closed = true
        }
      }
      let closed = false
      const ping = setInterval(() => {
        if (closed) return
        send('ping', { ts: Date.now() })
      }, 10000)
      let last = lastId
      async function maybeGenerateSignal() {
        await scanAndMaybeGenerate()
      }
      async function pushSignals() {
        await maybeGenerateSignal()
        await initDb()
        let signals = await dbListSignals()
        if (!signals || signals.length === 0) {
          signals = await readJson<any[]>('signals.json', [])
        }
        const newest = signals[signals.length - 1]?.id
        if (!last || (newest && newest !== last)) {
          last = newest
          send('signals', { signals })
        }
      }
      await pushSignals()
      // Polling frequency: increased to 5s to reduce DB load
      const poll = setInterval(pushSignals, 5000)
      const abort = new AbortController()
      abort.signal.addEventListener('abort', () => {
        clearInterval(ping)
        clearInterval(poll)
        closed = true
        controller.close()
      })
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
