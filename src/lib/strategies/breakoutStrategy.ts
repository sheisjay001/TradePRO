import { Candle } from '@/lib/market'

export interface BreakoutSignal {
  type: 'BUY' | 'SELL'
  entry: number
  stopLoss: number
  takeProfit: number
  confidence: number
  reason: string
  level: number
}

interface KeyLevel {
  price: number
  type: 'support' | 'resistance'
  strength: number
  time: number
}

export class BreakoutStrategy {
  private readonly symbol: string
  private candles: Candle[] = []

  constructor(symbol: string) {
    this.symbol = symbol
  }

  updateCandles(candles: Candle[]) {
    this.candles = candles
  }

  private calculateATR(candles: Candle[], period = 14): number {
    if (candles.length < period) return 0
    let sum = 0
    for (let i = candles.length - period; i < candles.length; i++) {
        sum += (candles[i].high - candles[i].low)
    }
    return sum / period
  }

  private findKeyLevels(candles: Candle[]): KeyLevel[] {
    const levels: KeyLevel[] = []
    const lookback = 10 // Broader lookback for significant levels
    
    // We only check up to the 3rd to last candle to find levels, 
    // because the last few candles might be the ones breaking it.
    for (let i = lookback; i < candles.length - 5; i++) {
      const current = candles[i]
      const prev = candles.slice(i - lookback, i)
      const next = candles.slice(i + 1, i + 1 + lookback)
      
      // Swing High (Resistance)
      const isHighest = prev.every(c => c.high <= current.high) && next.every(c => c.high <= current.high)
      if (isHighest) {
        levels.push({
            price: current.high,
            type: 'resistance',
            strength: 1,
            time: current.time
        })
      }
      
      // Swing Low (Support)
      const isLowest = prev.every(c => c.low >= current.low) && next.every(c => c.low >= current.low)
      if (isLowest) {
        levels.push({
            price: current.low,
            type: 'support',
            strength: 1,
            time: current.time
        })
      }
    }
    
    return this.mergeLevels(levels)
  }
  
  private mergeLevels(levels: KeyLevel[]): KeyLevel[] {
      const merged: KeyLevel[] = []
      levels.sort((a, b) => a.price - b.price)
      
      for (const level of levels) {
          if (merged.length === 0) {
              merged.push(level)
              continue
          }
          
          const last = merged[merged.length - 1]
          // If within 0.2% price difference, merge
          if (Math.abs(level.price - last.price) / last.price < 0.002) {
              last.strength++
              last.time = Math.max(last.time, level.time)
              // For resistance, take the higher one (conservative breakout)
              // For support, take the lower one (conservative breakout)
              if (last.type === 'resistance') last.price = Math.max(last.price, level.price)
              else last.price = Math.min(last.price, level.price)
          } else {
              merged.push(level)
          }
      }
      return merged
  }

  analyze(): BreakoutSignal | null {
    if (this.candles.length < 50) return null

    const levels = this.findKeyLevels(this.candles)
    const current = this.candles[this.candles.length - 1]
    const prev = this.candles[this.candles.length - 2]
    
    // Check for Breakouts
    // 1. Bullish Breakout: Close > Resistance
    // The previous candle should be BELOW the resistance (to ensure it's a fresh break)
    // Or just check if the current candle is the one that crossed it.
    
    // Filter levels that are "close" to current price
    const nearbyLevels = levels.filter(l => 
        Math.abs(current.close - l.price) / current.close < 0.02 // Within 2%
    )

    let bestSignal: BreakoutSignal | null = null

    for (const level of nearbyLevels) {
        // Bullish Breakout
        if (level.type === 'resistance') {
            // Check if we just broke it
            // Current close strictly above level
            // Previous close was below level OR current open was below level
            if (current.close > level.price && (prev.close <= level.price || current.open <= level.price)) {
                
                // Validate Breakout Candle
                const body = Math.abs(current.close - current.open)
                const range = current.high - current.low
                const isStrongCandle = body > range * 0.6 // Strong body
                
                if (isStrongCandle) {
                    const atr = this.calculateATR(this.candles)
                    const stopLoss = level.price - (atr * 1.5) // Below the level + buffer
                    const risk = current.close - stopLoss
                    const takeProfit = current.close + (risk * 2) // 1:2 RR
                    
                    const confidence = Math.min(0.9, 0.6 + (level.strength * 0.1))
                    
                    // Only pick if confidence is higher
                    if (!bestSignal || confidence > bestSignal.confidence) {
                        bestSignal = {
                            type: 'BUY',
                            entry: current.close,
                            stopLoss,
                            takeProfit,
                            confidence,
                            reason: `Bullish Breakout of Resistance at ${level.price}`,
                            level: level.price
                        }
                    }
                }
            }
        }
        
        // Bearish Breakout
        if (level.type === 'support') {
            // Check if we just broke it
            // Current close strictly below level
            if (current.close < level.price && (prev.close >= level.price || current.open >= level.price)) {
                
                 // Validate Breakout Candle
                const body = Math.abs(current.close - current.open)
                const range = current.high - current.low
                const isStrongCandle = body > range * 0.6 // Strong body
                
                if (isStrongCandle) {
                    const atr = this.calculateATR(this.candles)
                    const stopLoss = level.price + (atr * 1.5) // Above the level + buffer
                    const risk = stopLoss - current.close
                    const takeProfit = current.close - (risk * 2) // 1:2 RR
                    
                    const confidence = Math.min(0.9, 0.6 + (level.strength * 0.1))
                    
                     if (!bestSignal || confidence > bestSignal.confidence) {
                        bestSignal = {
                            type: 'SELL',
                            entry: current.close,
                            stopLoss,
                            takeProfit,
                            confidence,
                            reason: `Bearish Breakout of Support at ${level.price}`,
                            level: level.price
                        }
                    }
                }
            }
        }
    }

    return bestSignal
  }
}
