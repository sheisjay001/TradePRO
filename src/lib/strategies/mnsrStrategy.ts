import { Candle } from '@/lib/market'

export interface MNSRSignal {
  type: 'BUY' | 'SELL'
  entry: number
  stopLoss: number
  takeProfit: number
  confidence: number
  reason: string
}

interface KeyLevel {
  price: number
  type: 'support' | 'resistance'
  strength: number // Number of touches or sharpness
  time: number
}

export class MNSRStrategy {
  private readonly symbol: string
  private candles: Candle[] = []
  private htfCandles: Candle[] = []
  
  constructor(symbol: string) {
    this.symbol = symbol
  }

  updateCandles(candles: Candle[], htfCandles?: Candle[]) {
    this.candles = candles
    if (htfCandles) this.htfCandles = htfCandles
  }

  // Find "A" (Resistance) and "V" (Support) formations
  // Malaysian SnR focuses on sharp rejections (High wicks for A, Low wicks for V)
  private findKeyLevels(candles: Candle[]): KeyLevel[] {
    const levels: KeyLevel[] = []
    const lookback = 5 // Check 5 candles on each side for a local peak
    
    for (let i = lookback; i < candles.length - lookback; i++) {
      const current = candles[i]
      const prev = candles.slice(i - lookback, i)
      const next = candles.slice(i + 1, i + 1 + lookback)
      
      // Check for "A" shape (Resistance)
      // Highest high among neighbors
      const isHighest = prev.every(c => c.high < current.high) && next.every(c => c.high < current.high)
      if (isHighest) {
        // Sharpness check: The move down should be significant
        const drop = current.high - Math.min(...next.slice(0, 3).map(c => c.low))
        const atr = this.calculateATR(candles.slice(0, i+1))
        
        if (drop > atr * 2) {
            levels.push({
                price: current.high,
                type: 'resistance',
                strength: 1,
                time: current.time
            })
        }
      }
      
      // Check for "V" shape (Support)
      // Lowest low among neighbors
      const isLowest = prev.every(c => c.low > current.low) && next.every(c => c.low > current.low)
      if (isLowest) {
        // Sharpness check: The move up should be significant
        const rally = Math.max(...next.slice(0, 3).map(c => c.high)) - current.low
        const atr = this.calculateATR(candles.slice(0, i+1))
        
        if (rally > atr * 2) {
            levels.push({
                price: current.low,
                type: 'support',
                strength: 1,
                time: current.time
            })
        }
      }
    }
    
    // Merge close levels
    return this.mergeLevels(levels)
  }
  
  private mergeLevels(levels: KeyLevel[]): KeyLevel[] {
      const merged: KeyLevel[] = []
      // Sort by price
      levels.sort((a, b) => a.price - b.price)
      
      for (const level of levels) {
          if (merged.length === 0) {
              merged.push(level)
              continue
          }
          
          const last = merged[merged.length - 1]
          // If within 0.1% price difference, merge
          if (Math.abs(level.price - last.price) / last.price < 0.001) {
              last.strength++
              last.time = Math.max(last.time, level.time) // Keep most recent time
              // Keep the most extreme price (Highest for Res, Lowest for Supp)
              if (last.type === 'resistance') last.price = Math.max(last.price, level.price)
              else last.price = Math.min(last.price, level.price)
          } else {
              merged.push(level)
          }
      }
      return merged
  }

  private calculateATR(candles: Candle[], period = 14): number {
    if (candles.length < period) return 0
    let sum = 0
    for (let i = candles.length - period; i < candles.length; i++) {
        sum += (candles[i].high - candles[i].low)
    }
    return sum / period
  }

  private analyzeStoryline(): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
      if (this.htfCandles.length < 20) return 'NEUTRAL'
      
      // Simple structure analysis on HTF
      // Check last 20 candles for HH/HL or LH/LL
      // We look at swing points
      
      const swings: { type: 'H' | 'L', price: number, time: number }[] = []
      const lookback = 3
      
      for (let i = lookback; i < this.htfCandles.length - lookback; i++) {
          const current = this.htfCandles[i]
          const prev = this.htfCandles.slice(i - lookback, i)
          const next = this.htfCandles.slice(i + 1, i + 1 + lookback)
          
          const isHigh = prev.every(c => c.high < current.high) && next.every(c => c.high < current.high)
          const isLow = prev.every(c => c.low > current.low) && next.every(c => c.low > current.low)
          
          if (isHigh) swings.push({ type: 'H', price: current.high, time: current.time })
          if (isLow) swings.push({ type: 'L', price: current.low, time: current.time })
      }
      
      if (swings.length < 2) return 'NEUTRAL'
      
      const lastSwing = swings[swings.length - 1]
      const prevSwing = swings[swings.length - 2]
      
      if (lastSwing.type === 'H' && prevSwing.type === 'L') {
          // Recent leg up. Check if it broke previous high.
          const prevHigh = swings.find(s => s.type === 'H' && s.time < lastSwing.time)
          if (prevHigh && lastSwing.price > prevHigh.price) return 'BULLISH'
      } else if (lastSwing.type === 'L' && prevSwing.type === 'H') {
           // Recent leg down. Check if it broke previous low.
           const prevLow = swings.find(s => s.type === 'L' && s.time < lastSwing.time)
           if (prevLow && lastSwing.price < prevLow.price) return 'BEARISH'
      }
      
      // Default to moving average slope if structure is unclear
      const ma20 = this.htfCandles.slice(-20).reduce((sum, c) => sum + c.close, 0) / 20
      const ma50 = this.htfCandles.slice(-50).reduce((sum, c) => sum + c.close, 0) / 50
      
      return ma20 > ma50 ? 'BULLISH' : 'BEARISH'
  }

  analyze(): MNSRSignal | null {
    if (this.candles.length < 50) return null
    
    // Use HTF candles for levels if available, otherwise use current
    const analysisCandles = this.htfCandles.length > 0 ? this.htfCandles : this.candles
    const keyLevels = this.findKeyLevels(analysisCandles)
    const storyline = this.analyzeStoryline()
    
    const current = this.candles[this.candles.length - 1]
    const prev = this.candles[this.candles.length - 2]
    
    // 1. Check if we are near a Key Level
    const nearbyLevel = keyLevels.find(l => {
        const dist = Math.abs(current.close - l.price)
        const threshold = l.price * 0.002 // 0.2% tolerance
        return dist < threshold
    })
    
    if (!nearbyLevel) return null
    
    // 2. Check for Rejection / Engulfing at the level
    // MNSR Engulfing Setup:
    // If at Resistance: Look for Bearish Engulfing
    // If at Support: Look for Bullish Engulfing
    
    let signal: MNSRSignal | null = null
    
    if (nearbyLevel.type === 'resistance') {
        // Bearish Engulfing
        // Current Open > Prev Close (Gap up or flat) - Forex often flat
        // Current Close < Prev Open (Engulfs body)
        // Ideally engulfs wicks too for stronger signal
        
        const isBearishEngulfing = 
            current.close < current.open && // Red candle
            current.open >= prev.close && 
            current.close < prev.open &&
            current.close < prev.low // Strong engulf
            
        if (isBearishEngulfing) {
            signal = {
                type: 'SELL',
                entry: current.close,
                stopLoss: Math.max(current.high, nearbyLevel.price) + (current.high - current.low) * 0.1,
                takeProfit: current.close - (current.high - current.low) * 3, // 1:3 RR target
                confidence: 0.8 + (nearbyLevel.strength * 0.05),
                reason: 'MNSR Bearish Engulfing at Major Resistance'
            }
        }
    } else if (nearbyLevel.type === 'support') {
        // Bullish Engulfing
        const isBullishEngulfing = 
            current.close > current.open && // Green candle
            current.open <= prev.close &&
            current.close > prev.open &&
            current.close > prev.high // Strong engulf
            
        if (isBullishEngulfing) {
            signal = {
                type: 'BUY',
                entry: current.close,
                stopLoss: Math.min(current.low, nearbyLevel.price) - (current.high - current.low) * 0.1,
                takeProfit: current.close + (current.high - current.low) * 3, // 1:3 RR target
                confidence: 0.8 + (nearbyLevel.strength * 0.05),
                reason: 'MNSR Bullish Engulfing at Major Support'
            }
        }
    }
    
    return signal
  }
}
