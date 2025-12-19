import { listSignals, closeSignal, DbSignal } from './db'
import { getBinanceKlines } from './market'
import { readJson, writeJson } from './store'

export async function monitorActiveSignals() {
  console.log('[Monitor] Checking active signals...')
  
  // Get active signals
  let signals: DbSignal[] = []
  try {
    const allSignals = await listSignals()
    signals = allSignals.filter(s => s.status === 'ACTIVE')
  } catch (e) {
    console.error('[Monitor] DB error, trying JSON fallback:', e)
    const jsonSignals = await readJson<DbSignal[]>('signals.json', [])
    signals = jsonSignals.filter(s => s.status === 'ACTIVE')
  }

  if (signals.length === 0) {
    console.log('[Monitor] No active signals to check.')
    return
  }

  // Group by symbol to batch price checks
  const symbolSet = new Set(signals.map(s => s.symbol))
  const symbols: string[] = []
  symbolSet.forEach(s => symbols.push(s))
  const prices: Record<string, number> = {}

  for (const symbol of symbols) {
    try {
      // Get latest 1m candle for current price
      const klines = await getBinanceKlines(symbol, '1m', 1)
      if (klines.length > 0) {
        prices[symbol] = klines[0].close
      }
    } catch (e) {
      console.error(`[Monitor] Failed to fetch price for ${symbol}:`, e)
    }
  }

  // Check each signal
  for (const signal of signals) {
    const currentPrice = prices[signal.symbol]
    if (!currentPrice) continue

    let result: 'WIN' | 'LOSS' | null = null
    const { type, entry, stopLoss, takeProfit } = signal

    // Handle multiple TP levels (take the first one for simplicity or logic to track partials)
    // For now, we treat hitting the FIRST TP as a WIN for the signal status
    const tp = Array.isArray(takeProfit) ? takeProfit[0] : takeProfit

    if (type === 'BUY') {
      if (currentPrice <= stopLoss) {
        result = 'LOSS'
      } else if (currentPrice >= tp) {
        result = 'WIN'
      }
    } else if (type === 'SELL') {
      if (currentPrice >= stopLoss) {
        result = 'LOSS'
      } else if (currentPrice <= tp) {
        result = 'WIN'
      }
    }

    if (result) {
      console.log(`[Monitor] Signal ${signal.id} (${signal.symbol} ${type}) result: ${result} @ ${currentPrice}`)
      
      // Update DB
      try {
        await closeSignal(signal.id, result)
      } catch (e) {
        console.error(`[Monitor] Failed to update signal ${signal.id} in DB:`, e)
      }

      // Update JSON (always sync JSON for fallback)
      try {
        const jsonSignals = await readJson<DbSignal[]>('signals.json', [])
        const idx = jsonSignals.findIndex(s => s.id === signal.id)
        if (idx !== -1) {
          jsonSignals[idx].status = 'CLOSED'
          jsonSignals[idx].result = result
          jsonSignals[idx].closedAt = new Date().toISOString()
          await writeJson('signals.json', jsonSignals)
        }
      } catch (e) {
        console.error(`[Monitor] Failed to update signal ${signal.id} in JSON:`, e)
      }
    }
  }
}
