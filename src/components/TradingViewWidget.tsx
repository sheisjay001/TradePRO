/* eslint-disable @next/next/no-sync-scripts */
'use client'
import { useEffect, useRef } from 'react'

type Props = { symbol: string; entry?: number; stopLoss?: number; takeProfit?: number | number[] }

export default function TradingViewWidget({ symbol, entry, stopLoss, takeProfit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = containerRef.current
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [[symbol]],
      chartOnly: false,
      width: '100%',
      height: 500,
      locale: 'en',
      colorTheme: 'light',
      autosize: true,
      showVolume: true,
      showMA: true,
    })
    container?.appendChild(script)
    return () => {
      if (container) {
        while (container.firstChild) container.removeChild(container.firstChild)
      }
    }
  }, [symbol])
  return (
    <div className="relative tradingview-widget-container" ref={containerRef}>
      {(entry !== undefined || stopLoss !== undefined || takeProfit !== undefined) && (
        <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur rounded shadow px-3 py-2 text-sm space-y-1">
          {entry !== undefined && <p className="text-blue-700">Entry: {entry}</p>}
          {stopLoss !== undefined && <p className="text-red-700">SL: {stopLoss}</p>}
          {takeProfit !== undefined && (
            <p className="text-green-700">TP: {Array.isArray(takeProfit) ? takeProfit.join(', ') : takeProfit}</p>
          )}
        </div>
      )}
    </div>
  )
}
