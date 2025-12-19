'use client'
import TradingViewAdvancedChart from './TradingViewAdvancedChart'

type Props = { symbol: string }

export default function LowerTimeframes({ symbol }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-2">
        <p className="text-xs font-medium mb-2">1m</p>
        <TradingViewAdvancedChart symbol={symbol} interval="1" height={260} />
      </div>
      <div className="bg-white rounded-lg shadow p-2">
        <p className="text-xs font-medium mb-2">5m</p>
        <TradingViewAdvancedChart symbol={symbol} interval="5" height={260} />
      </div>
      <div className="bg-white rounded-lg shadow p-2">
        <p className="text-xs font-medium mb-2">15m</p>
        <TradingViewAdvancedChart symbol={symbol} interval="15" height={260} />
      </div>
    </div>
  )
}
