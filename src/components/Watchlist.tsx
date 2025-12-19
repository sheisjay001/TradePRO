'use client'
import { useEffect, useState } from 'react'

export default function Watchlist() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [input, setInput] = useState('')

  async function load() {
    const res = await fetch('/api/watchlist')
    const data = await res.json().catch(() => ({}))
    setSymbols(data.watchlist || [])
  }

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const s = input.trim().toUpperCase()
    if (!s) return
    setInput('')
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: s }),
    })
    const data = await res.json().catch(() => ({}))
    setSymbols(data.watchlist || [])
  }

  async function remove(s: string) {
    const res = await fetch(`/api/watchlist?symbol=${encodeURIComponent(s)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setSymbols(data.watchlist || [])
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Watchlist</h2>
      <form onSubmit={add} className="flex gap-2 mb-3">
        <input className="border rounded px-3 py-2 flex-1" placeholder="Add symbol e.g. BTCUSDT" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="bg-blue-600 text-white rounded px-4">Add</button>
      </form>
      {symbols.length === 0 ? (
        <p className="text-sm text-gray-600">No symbols added yet.</p>
      ) : (
        <ul className="space-y-2">
          {symbols.map((s) => (
            <li key={s} className="flex items-center justify-between border rounded px-3 py-2">
              <span className="font-medium">{s}</span>
              <button className="text-sm bg-gray-200 rounded px-2 py-1" onClick={() => remove(s)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
