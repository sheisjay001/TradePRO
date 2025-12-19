import { readJson, writeJson } from './store'
import crypto from 'crypto'
import { initDb, listSignals as dbListSignals, insertSignal as dbInsertSignal } from './db'
import { validateSignalRisk } from './risk'
import { getRiskConfig } from './config'
import { getBinanceKlines, Candle } from './market'
import { ForexIndicesStrategy } from './strategies/forexIndicesStrategy'
import { MNSRStrategy } from './strategies/mnsrStrategy'
import { BreakoutStrategy } from './strategies/breakoutStrategy'
import { notifySignalToAllUsers } from './notifications'

// Utility function to find zones (Basic version for fallback/crypto)
interface Zone {
  support: number;
  resistance: number;
  demand: number;
  supply: number;
}

function findZones(candles: Candle[], lookback = 20): Zone {
  if (candles.length < lookback) {
    return { support: 0, resistance: 0, demand: 0, supply: 0 }
  }
  
  const recent = candles.slice(-lookback)
  const highs = recent.map(c => c.high)
  const lows = recent.map(c => c.low)
  
  const support = Math.min(...lows)
  const resistance = Math.max(...highs)
  const range = resistance - support
  
  return {
    support,
    resistance,
    demand: support + (range * 0.382),
    supply: resistance - (range * 0.382)
  }
}

function calculateATR(candles: Candle[], period: number): number {
  if (candles.length < period + 1) return 0;
  
  let sumTR = 0;
  for (let i = 1; i <= period; i++) {
    const prevClose = candles[i-1].close;
    const current = candles[i];
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - prevClose);
    const tr3 = Math.abs(current.low - prevClose);
    sumTR += Math.max(tr1, tr2, tr3);
  }
  
  return sumTR / period;
}

async function generateCryptoSignal(symbol: string, timeframes: { htf: string; ltf: string }, cfg: any) {
  let htf: Candle[] = []
  let ltf: Candle[] = []
  
  try {
    htf = await getBinanceKlines(symbol, timeframes.htf, 500)
    ltf = await getBinanceKlines(symbol, timeframes.ltf, 500)
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error)
    return null
  }

  if (htf.length < 50 || ltf.length < 50) {
    return null
  }

  const zones = findZones(htf)
  const last = ltf[ltf.length - 1]
  
  let type: 'BUY' | 'SELL' | null = null
  let entry = last.close
  let stopLoss = 0
  let takeProfit = 0
  
  // Basic Crypto Strategy Logic
  if (last.close < zones.support * 1.01) {
     type = 'BUY'
     stopLoss = zones.support * 0.98
     takeProfit = zones.resistance * 0.98
  } else if (last.close > zones.resistance * 0.99) {
     type = 'SELL'
     stopLoss = zones.resistance * 1.02
     takeProfit = zones.support * 1.02
  }
  
  if (!type) return null
  
  return { type, entry, stopLoss, takeProfit, market: 'CRYPTO' as const, symbol }
}

async function generateForexIndicesSignal(symbol: string, timeframe: string, cfg: any) {
  try {
    const candles = await getBinanceKlines(symbol, timeframe, 500)
    // Try to get HTF candles for MNSR
    let htfCandles: Candle[] = []
    try {
        htfCandles = await getBinanceKlines(symbol, '4h', 500)
    } catch (e) {
        console.warn(`Could not fetch HTF candles for ${symbol}, using LTF only`)
    }

    if (candles.length < 50) {
        console.log(`[Auto] Not enough candles for ${symbol} (${candles.length})`)
        return null
    }
    
    // 1. Run Supply & Demand Strategy
    console.log(`[Auto] Running S&D Strategy for ${symbol}...`)
    const sndStrategy = new ForexIndicesStrategy(symbol, timeframe)
    sndStrategy.updateCandles(candles)
    const sndSignal = sndStrategy.analyze()
    if (sndSignal) console.log(`[Auto] S&D Signal found:`, sndSignal.type, sndSignal.confidence)
    
    // 2. Run MNSR Strategy
    console.log(`[Auto] Running MNSR Strategy for ${symbol}...`)
    const mnsrStrategy = new MNSRStrategy(symbol)
    mnsrStrategy.updateCandles(candles, htfCandles.length > 0 ? htfCandles : undefined)
    const mnsrSignal = mnsrStrategy.analyze()
    if (mnsrSignal) console.log(`[Auto] MNSR Signal found:`, mnsrSignal.type, mnsrSignal.confidence)
    
    // 3. Run Breakout Strategy
    console.log(`[Auto] Running Breakout Strategy for ${symbol}...`)
    const breakoutStrategy = new BreakoutStrategy(symbol)
    breakoutStrategy.updateCandles(candles)
    const breakoutSignal = breakoutStrategy.analyze()
    if (breakoutSignal) console.log(`[Auto] Breakout Signal found for ${symbol}:`, breakoutSignal.type, breakoutSignal.confidence)
    else console.log(`[Auto] No Breakout Signal for ${symbol}`)

    // Compare and Select Best Signal
    let finalSignal = null
    let strategyName = ''
    
    // Collect all signals
    const signals = [
        { name: 'S&D', signal: sndSignal },
        { name: 'MNSR', signal: mnsrSignal },
        { name: 'Breakout', signal: breakoutSignal }
    ].filter(s => s.signal !== null)

    if (signals.length > 0) {
        // Sort by confidence
        signals.sort((a, b) => (b.signal!.confidence - a.signal!.confidence))
        
        // Check for confluence (Matching directions)
        const best = signals[0]
        const direction = best.signal!.type
        
        const agreeingSignals = signals.filter(s => s.signal!.type === direction)
        
        if (agreeingSignals.length > 1) {
            console.log(`[Auto] Confluence found between ${agreeingSignals.map(s => s.name).join(' & ')}`)
            finalSignal = best.signal
            finalSignal!.confidence = Math.min(0.95, finalSignal!.confidence + 0.1)
            strategyName = best.name
        } else {
             // No confluence or conflict
             if (signals.length > 1) console.log(`[Auto] Signals conflict or mixed. Picking highest confidence.`)
             finalSignal = best.signal
             strategyName = best.name
        }
    }
    
    if (!finalSignal || !finalSignal.type) return null
    
    console.log(`[Auto] Final Signal Selected: ${strategyName} ${finalSignal.type}`)

    const riskRewardOk = validateSignalRisk(
      { type: finalSignal.type, entry: finalSignal.entry, stopLoss: finalSignal.stopLoss, takeProfit: finalSignal.takeProfit },
      cfg.minRR
    )
    
    if (!riskRewardOk) {
        console.log(`[Auto] Signal rejected due to RR check.`)
        return null
    }
    
    const reason = (finalSignal as any).reason || `Strategy: ${strategyName} (Confidence: ${finalSignal.confidence.toFixed(2)})`

    return {
      type: finalSignal.type,
      entry: finalSignal.entry,
      stopLoss: finalSignal.stopLoss,
      takeProfit: finalSignal.takeProfit,
      market: (symbol.match(/[A-Z]{6}/) ? 'FOREX' : 'INDICES') as 'FOREX' | 'INDICES',
      symbol,
      confidence: finalSignal.confidence,
      reason
    }
  } catch (error) {
    console.error(`Error generating signal for ${symbol}:`, error)
    return null
  }
}

export async function scanAndMaybeGenerate() {
  console.log('[Auto] Starting scan...')
  
  // 0. Monitor active signals (Check for TP/SL hits)
  // TODO: Implement monitorActiveSignals or remove this line
  // await monitorActiveSignals()

  const now = Date.now()
  const auto = await readJson<{ nextScanAt?: number; lastGeneratedAt?: number; lastId?: string }>('auto.json', {})
  // DEBUG: Ignore nextScanAt for manual run
  // if (auto.nextScanAt && now < auto.nextScanAt) return false
  
  await initDb()
  const cfg = await getRiskConfig()
  console.log(`[Auto] Risk Config:`, cfg)
  
  // Get existing signals to check daily limit
  let signalsAny: any[] = await dbListSignals()
  if (!signalsAny || signalsAny.length === 0) {
    signalsAny = await readJson<any[]>('signals.json', [])
  }
  
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const todaysCount = signalsAny.filter((s) => {
    const created = (s as any).createdAt ? new Date((s as any).createdAt).getTime() : 0
    return created >= start
  }).length
  
  console.log(`[Auto] Today's signal count: ${todaysCount}/${cfg.dailyLimit}`)

  if (todaysCount >= cfg.dailyLimit) {
    console.log(`[Auto] Daily limit reached.`)
    await writeJson('auto.json', { ...auto, nextScanAt: now + 10 * 60 * 1000 })
    return false
  }
  
  // Define symbols to scan
  const forexSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']
  const indicesSymbols = ['US30', 'US100', 'US500']
  const cryptoSymbols = ['BTCUSDT', 'ETHUSDT']
  
  // Try to generate signals for each market
  let newSignal = null
  
  // 1. Try forex first
  for (const symbol of forexSymbols) {
    console.log(`[Auto] Scanning ${symbol}...`)
    try {
        newSignal = await generateForexIndicesSignal(symbol, '1h', cfg)
    } catch (err) {
        console.error(`[Auto] Error scanning ${symbol}:`, err)
    }
    if (newSignal) break
  }
  
  // 2. Then try indices
  if (!newSignal) {
    for (const symbol of indicesSymbols) {
      console.log(`[Auto] Scanning ${symbol}...`)
      try {
        newSignal = await generateForexIndicesSignal(symbol, '1h', cfg)
      } catch (err) {
        console.error(`[Auto] Error scanning ${symbol}:`, err)
      }
      if (newSignal) break
    }
  }
  
  // 3. Fall back to crypto if no forex/indices signals
  if (!newSignal) {
    for (const symbol of cryptoSymbols) {
      console.log(`[Auto] Scanning ${symbol}...`)
      const signal = await generateCryptoSignal(symbol, { htf: '4h', ltf: '15m' }, cfg)
      if (signal) {
        newSignal = {
          ...signal,
          confidence: 0.5,
          market: 'CRYPTO' as const
        }
        break
      }
    }
  }
  
  if (newSignal) {
    console.log(`[Auto] New Signal Generated!`, newSignal)
    // Create the signal object with a better unique ID
    const signalWithId = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE' as const,
      ...newSignal
    }
    
    try {
            await dbInsertSignal(signalWithId)
            console.log(`[Auto] Signal saved to DB.`)
        } catch (e) {
            console.error(`[Auto] Failed to save to DB:`, e)
            // Fallback to local JSON
            try {
                const jsonSignals = await readJson<any[]>('signals.json', [])
                jsonSignals.push(signalWithId)
                await writeJson('signals.json', jsonSignals)
                console.log(`[Auto] Signal saved to local JSON (fallback).`)
            } catch (jsonErr) {
                console.error(`[Auto] Failed to save to local JSON:`, jsonErr)
            }
        }

        // Notify users
        try {
            await notifySignalToAllUsers(signalWithId)
            console.log(`[Auto] Notifications queued for users.`)
        } catch (ne) {
            console.error(`[Auto] Failed to notify users:`, ne)
        }
    
    // Also save to json as backup/cache
    const currentSignals = await readJson<any[]>('signals.json', [])
    currentSignals.unshift(signalWithId)
    if (currentSignals.length > 50) currentSignals.pop()
    await writeJson('signals.json', currentSignals)
    
    // Update auto state
    await writeJson('auto.json', { 
        ...auto, 
        lastGeneratedAt: now,
        nextScanAt: now + 60 * 60 * 1000
    })
    
    return true
  }
  
  console.log(`[Auto] No signal found.`)
  // No signal found, retry in 5 mins
  await writeJson('auto.json', { ...auto, nextScanAt: now + 5 * 60 * 1000 })
  return false
}
