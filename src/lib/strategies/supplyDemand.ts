import { Candle } from '@/lib/market'

export interface SupplyDemandZone {
  type: 'supply' | 'demand'
  high: number
  low: number
  entry: number
  stopLoss: number
  strength: number
  valid: boolean
  timestamp: number
  liquidity?: {
    level: number
    type: 'equal_highs' | 'equal_lows' | 'trendline' | 'swing'
  }
}

// Helper to calculate ATR
function calculateATR(candles: Candle[], period: number = 14): number[] {
  const atr: number[] = []
  const trs: number[] = []
  
  for (let i = 0; i < candles.length; i++) {
    const current = candles[i]
    const prev = i > 0 ? candles[i - 1] : null
    
    let tr = current.high - current.low
    if (prev) {
      tr = Math.max(tr, Math.abs(current.high - prev.close), Math.abs(current.low - prev.close))
    }
    trs.push(tr)
  }

  // Simple Moving Average for first ATR, then Wilder's smoothing or just SMA for simplicity
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      atr.push(0)
      continue
    }
    const sum = trs.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    atr.push(sum / period)
  }
  return atr
}

export function findSupplyDemandZones(candles: Candle[], lookback = 200): SupplyDemandZone[] {
  const zones: SupplyDemandZone[] = []
  if (candles.length < 50) return zones

  const atr = calculateATR(candles)
  
  // 1. Identify Impulse Moves (Imbalance)
  for (let i = 20; i < candles.length - 2; i++) {
    const candle = candles[i]
    const prevCandle = candles[i - 1]
    const currentATR = atr[i]
    
    const bodySize = Math.abs(candle.close - candle.open)
    const isStrongMove = bodySize > 1.5 * currentATR
    
    if (!isStrongMove) continue
    
    // 2. Identify Demand (Drop-Base-Rally or Rally-Base-Rally)
    // Strong Bullish Candle
    if (candle.close > candle.open) {
      // Check for base (small candles before)
      const baseCandle = prevCandle
      const baseBody = Math.abs(baseCandle.close - baseCandle.open)
      
      // If base is relatively small compared to impulse
      if (baseBody < bodySize * 0.6) {
        // Create Demand Zone
        zones.push({
          type: 'demand',
          // Zone covers the base candle range + wicks
          high: Math.max(baseCandle.open, baseCandle.close),
          low: baseCandle.low,
          entry: Math.max(baseCandle.open, baseCandle.close),
          stopLoss: baseCandle.low - (currentATR * 0.2), // Buffer
          strength: 2, 
          valid: true,
          timestamp: baseCandle.time
        })
      }
    }
    
    // 3. Identify Supply (Rally-Base-Drop or Drop-Base-Drop)
    // Strong Bearish Candle
    else if (candle.close < candle.open) {
      const baseCandle = prevCandle
      const baseBody = Math.abs(baseCandle.close - baseCandle.open)
      
      if (baseBody < bodySize * 0.6) {
        // Create Supply Zone
        zones.push({
          type: 'supply',
          high: baseCandle.high + (currentATR * 0.2), // Buffer
          low: Math.min(baseCandle.open, baseCandle.close),
          entry: Math.min(baseCandle.open, baseCandle.close),
          stopLoss: baseCandle.high + (currentATR * 0.2), // Buffer
          strength: 2,
          valid: true,
          timestamp: baseCandle.time
        })
      }
    }
  }

  // 4. Identify Liquidity (Swing points)
  const swings = findSwings(candles)
  
  // Attach liquidity to zones
  zones.forEach(zone => {
    // Check for Equal Highs/Lows near the zone
    if (zone.type === 'supply') {
      // Look for highs just above or inside the zone that might be swept
      const nearbyHighs = swings.highs.filter(h => 
        Math.abs(h.price - zone.high) < zone.high * 0.002 // 0.2% proximity
      )
      if (nearbyHighs.length > 1) {
        zone.liquidity = { level: zone.high, type: 'equal_highs' }
        zone.strength += 1
      }
    } else {
      const nearbyLows = swings.lows.filter(l => 
        Math.abs(l.price - zone.low) < zone.low * 0.002
      )
      if (nearbyLows.length > 1) {
        zone.liquidity = { level: zone.low, type: 'equal_lows' }
        zone.strength += 1
      }
    }
  })
  
  // Filter broken zones
  // A zone is broken if price violates the Stop Loss level AFTER the zone was created.
  // We also only want "fresh" zones or zones that haven't been completely invalidated.
  const activeZones = zones.filter(zone => {
    // Find candles after zone creation
    const futureCandles = candles.filter(c => c.time > zone.timestamp)
    
    for (const c of futureCandles) {
        // If price closed beyond stop loss, zone is broken
        if (zone.type === 'supply' && c.close > zone.stopLoss) return false
        if (zone.type === 'demand' && c.close < zone.stopLoss) return false
    }
    return true
  })
  
  // Return newest zones first
  return activeZones.sort((a, b) => b.timestamp - a.timestamp)
}

function findSwings(candles: Candle[]) {
  const highs: {time: number, price: number}[] = []
  const lows: {time: number, price: number}[] = []
  
  for (let i = 2; i < candles.length - 2; i++) {
    const current = candles[i]
    const prev1 = candles[i-1]
    const prev2 = candles[i-2]
    const next1 = candles[i+1]
    const next2 = candles[i+2]
    
    if (current.high > prev1.high && current.high > prev2.high && 
        current.high > next1.high && current.high > next2.high) {
      highs.push({ time: current.time, price: current.high })
    }
    
    if (current.low < prev1.low && current.low < prev2.low && 
        current.low < next1.low && current.low < next2.low) {
      lows.push({ time: current.time, price: current.low })
    }
  }
  return { highs, lows }
}

export function isInZone(price: number, zone: SupplyDemandZone): boolean {
  // Use stop loss as outer bound and entry as inner bound
  if (zone.type === 'supply') {
      return price <= zone.stopLoss && price >= zone.low
  } else {
      return price >= zone.stopLoss && price <= zone.high
  }
}

export function analyzePriceAction(candles: Candle[], zone: SupplyDemandZone): { rejection: boolean, volume: number } {
    const last = candles[candles.length - 1]
    const prev = candles[candles.length - 2]
    
    let rejection = false
    let volume = last.volume
    
    // Pinbar detection
    const body = Math.abs(last.close - last.open)
    const range = last.high - last.low
    const isSmallBody = body < range * 0.3
    
    if (zone.type === 'supply') {
        // Shooting star or Bearish Engulfing
        const upperWick = last.high - Math.max(last.open, last.close)
        const isShootingStar = isSmallBody && upperWick > range * 0.5
        const isBearishEngulfing = last.close < last.open && last.close < prev.low && last.open > prev.high
        
        if (isShootingStar || isBearishEngulfing) rejection = true
    } else {
        // Hammer or Bullish Engulfing
        const lowerWick = Math.min(last.open, last.close) - last.low
        const isHammer = isSmallBody && lowerWick > range * 0.5
        const isBullishEngulfing = last.close > last.open && last.close > prev.high && last.open < prev.low
        
        if (isHammer || isBullishEngulfing) rejection = true
    }
    
    return { rejection, volume }
}
