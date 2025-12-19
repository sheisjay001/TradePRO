import { NextRequest } from 'next/server'
import { readJson } from '@/lib/store'
import { initDb, listSignals as dbListSignals } from '@/lib/db'
import { scanAndMaybeGenerate } from '@/lib/auto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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
      const poll = setInterval(pushSignals, 3000)
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
