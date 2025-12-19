'use client'
import { useEffect, useRef } from 'react'

type Props = { symbol: string; interval: string; height?: number }

export default function TradingViewAdvancedChart({ symbol, interval, height = 300 }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      width: '100%',
      height,
      hide_top_toolbar: false,
      allow_symbol_change: false,
      autosize: true,
    })
    container?.appendChild(script)
    return () => {
      if (container) {
        while (container.firstChild) container.removeChild(container.firstChild)
      }
    }
  }, [symbol, interval, height])
  return <div ref={ref} />
}
