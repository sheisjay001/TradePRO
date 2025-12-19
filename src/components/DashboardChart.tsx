'use client'
import { useState } from 'react'
import TradingViewWidget from './TradingViewWidget'
import LowerTimeframes from './LowerTimeframes'

const POPULAR_SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'AUDUSD',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'XAUUSD',
  'SPX500',
  'NASDAQ',
]

export default function DashboardChart() {
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [showLower, setShowLower] = useState(true)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live Chart</h2>
        <select
          className="border rounded px-3 py-1 text-sm bg-white"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          {POPULAR_SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-lg shadow p-4 min-h-[500px]">
        <TradingViewWidget symbol={symbol} />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Lower timeframes</p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showLower} onChange={(e) => setShowLower(e.target.checked)} />
          Show
        </label>
      </div>
      {showLower && <LowerTimeframes symbol={symbol} />}
    </div>
  )
}
