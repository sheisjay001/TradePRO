type Signal = {
  type: 'BUY' | 'SELL'
  entry: number
  stopLoss: number
  takeProfit: number | number[]
}

export function rr(entry: number, sl: number, tp: number, type: 'BUY' | 'SELL') {
  const risk = type === 'BUY' ? entry - sl : sl - entry
  const reward = type === 'BUY' ? tp - entry : entry - tp
  if (risk <= 0 || reward <= 0) return 0
  return reward / risk
}

export function validateSignalRisk(signal: Signal, minRR: number) {
  const tps = Array.isArray(signal.takeProfit) ? signal.takeProfit : [signal.takeProfit]
  const best = Math.max(...tps.map((tp) => rr(signal.entry, signal.stopLoss, tp, signal.type)))
  return best >= minRR
}
