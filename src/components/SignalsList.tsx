'use client'
import { useEffect, useState } from 'react'

type Signal = {
  id: string
  type: 'BUY' | 'SELL'
  market: 'FOREX' | 'CRYPTO' | 'INDICES'
  symbol: string
  entry: number
  stopLoss: number
  takeProfit: number | number[]
  expiresAt: string
  status: 'ACTIVE' | 'INACTIVE' | 'CLOSED'
  result?: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'EXPIRED'
}

export default function SignalsList({ showHistory = false }: { showHistory?: boolean }) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/signals')
      let data: any = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      setSignals(data.signals ?? [])
    } catch {
      setSignals([])
    }
    setLoading(false)
  }

  useEffect(() => {
    let sse: EventSource | null = null
    let pollId: number | null = null
    load()
    try {
      sse = new EventSource('/api/signals/stream')
      sse.addEventListener('signals', (e: MessageEvent) => {
        const data = JSON.parse(e.data)
        setSignals(data.signals ?? [])
        setLoading(false)
      })
      sse.onerror = () => {
        sse?.close()
        if (!pollId) {
          pollId = window.setInterval(load, 5000)
        }
      }
    } catch {
      pollId = window.setInterval(load, 5000)
      return () => {
        if (pollId) window.clearInterval(pollId)
      }
    }
    return () => {
      sse?.close()
      if (pollId) window.clearInterval(pollId)
    }
  }, [])

  const filtered = signals.filter(s => showHistory ? s.status === 'CLOSED' : s.status === 'ACTIVE')

  if (loading && signals.length === 0) return <p className="text-sm">Loading signals...</p>
  if (filtered.length === 0) return <p className="text-sm">No {showHistory ? 'history' : 'active signals'}.</p>

  return (
    <ul className="space-y-3">
      {filtered.map((s) => (
        <li key={s.id} className={`border rounded p-3 ${s.result === 'WIN' ? 'bg-green-50' : s.result === 'LOSS' ? 'bg-red-50' : ''}`}>
          <div className="flex items-center justify-between">
            <p className={`font-medium ${s.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>{s.type} {s.symbol}</p>
            <div className="flex gap-2">
              <span className="text-xs bg-gray-200 px-2 py-1 rounded">{s.market}</span>
              {s.result && <span className={`text-xs px-2 py-1 rounded ${s.result === 'WIN' ? 'bg-green-200 text-green-800' : s.result === 'LOSS' ? 'bg-red-200 text-red-800' : 'bg-gray-200'}`}>{s.result}</span>}
            </div>
          </div>
          <div className="text-sm mt-2 grid grid-cols-2 gap-2">
            <p>Entry: {s.entry}</p>
            <p>SL: {s.stopLoss}</p>
            <p>TP: {Array.isArray(s.takeProfit) ? s.takeProfit.join(', ') : s.takeProfit}</p>
            <p>Expires: {new Date(s.expiresAt).toLocaleString()}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
