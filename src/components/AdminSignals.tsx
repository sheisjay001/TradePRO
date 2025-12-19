'use client'
import { useState, useEffect } from 'react'

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

export default function AdminSignals() {
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY')
  const [market, setMarket] = useState<'FOREX' | 'CRYPTO' | 'INDICES'>('CRYPTO')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [entry, setEntry] = useState<number>(0)
  const [sl, setSl] = useState<number>(0)
  const [tp, setTp] = useState<string>('0')
  const [expiresAt, setExpiresAt] = useState<string>(new Date(Date.now() + 60 * 60 * 1000).toISOString())
  const [msg, setMsg] = useState<string | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])

  async function loadSignals() {
    try {
      const res = await fetch('/api/signals')
      let data: any = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }
      setSignals(data.signals || [])
    } catch {
      setSignals([])
    }
  }

  useEffect(() => {
    loadSignals()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const takeProfit = tp.includes(',') ? tp.split(',').map((v) => Number(v.trim())).filter(Boolean) : Number(tp)
    const res = await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, market, symbol, entry: Number(entry), stopLoss: Number(sl), takeProfit, expiresAt }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setMsg('Signal created')
      loadSignals()
    } else {
      setMsg(data?.error ?? 'Failed to create signal')
    }
  }

  async function closeSignal(id: string, result: string) {
    if (!confirm(`Mark as ${result}?`)) return
    await fetch(`/api/signals/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result })
    })
    loadSignals()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <select className="border rounded px-3 py-2" value={type} onChange={(e) => setType(e.target.value as 'BUY' | 'SELL')}>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <select className="border rounded px-3 py-2" value={market} onChange={(e) => setMarket(e.target.value as any)}>
            <option value="FOREX">FOREX</option>
            <option value="CRYPTO">CRYPTO</option>
            <option value="INDICES">INDICES</option>
          </select>
          <input className="border rounded px-3 py-2" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol" />
          <input className="border rounded px-3 py-2" type="number" value={entry} onChange={(e) => setEntry(Number(e.target.value))} placeholder="Entry" />
          <input className="border rounded px-3 py-2" type="number" value={sl} onChange={(e) => setSl(Number(e.target.value))} placeholder="Stop Loss" />
          <input className="border rounded px-3 py-2" value={tp} onChange={(e) => setTp(e.target.value)} placeholder="Take Profit (single or comma-separated)" />
          <input className="border rounded px-3 py-2" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} placeholder="Expires At (ISO)" />
        </div>
        <button className="bg-green-600 text-white rounded px-4 py-2">Create Signal</button>
        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Manage Signals</h3>
        <div className="space-y-2">
          {signals.map(s => (
            <div key={s.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <span className={`font-bold ${s.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>{s.type} {s.symbol}</span>
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{s.status}</span>
                {s.result && <span className={`ml-2 text-xs px-2 py-1 rounded ${s.result === 'WIN' ? 'bg-green-100 text-green-800' : s.result === 'LOSS' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>{s.result}</span>}
              </div>
              {s.status === 'ACTIVE' && (
                <div className="flex gap-2">
                  <button onClick={() => closeSignal(s.id, 'WIN')} className="bg-green-500 text-white text-xs px-2 py-1 rounded hover:bg-green-600">WIN</button>
                  <button onClick={() => closeSignal(s.id, 'LOSS')} className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600">LOSS</button>
                  <button onClick={() => closeSignal(s.id, 'BREAK_EVEN')} className="bg-gray-500 text-white text-xs px-2 py-1 rounded hover:bg-gray-600">BE</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
