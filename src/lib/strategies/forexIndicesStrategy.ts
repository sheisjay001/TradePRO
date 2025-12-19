import { Candle } from '@/lib/market'
import { findSupplyDemandZones, analyzePriceAction, isInZone, SupplyDemandZone } from '@/lib/strategies/supplyDemand'

export interface ForexIndicesSignal {
  type: 'BUY' | 'SELL' | null
  entry: number
  stopLoss: number
  takeProfit: number
  confidence: number
  zone: SupplyDemandZone
  liquidityHit: boolean
}

export class ForexIndicesStrategy {
  private readonly symbol: string
  private readonly timeframe: string
  private candles: Candle[] = []
  private zones: SupplyDemandZone[] = []
  
  constructor(symbol: string, timeframe: string = '1h') {
    this.symbol = symbol
    this.timeframe = timeframe
  }

  updateCandles(newCandles: Candle[]) {
    this.candles = newCandles
    this.zones = findSupplyDemandZones(this.candles)
  }

  private isForexOrIndices(): boolean {
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'USDCHF']
    const indices = ['US30', 'US100', 'US500', 'FTSE100', 'DAX', 'NIKKEI', 'ASX200']
    
    const symbol = this.symbol.toUpperCase()
    return forexPairs.includes(symbol) || indices.includes(symbol)
  }

  analyze(): ForexIndicesSignal | null {
    if (!this.isForexOrIndices() || this.candles.length < 50) {
      return null
    }

    const currentPrice = this.candles[this.candles.length - 1].close
    
    // Find zones that price is currently inside or touching
    const activeZones = this.zones.filter(zone => isInZone(currentPrice, zone))

    if (activeZones.length === 0) return null

    // Sort zones by strength (strongest first)
    activeZones.sort((a, b) => b.strength - a.strength)
    const strongestZone = activeZones[0]
    
    // Check Price Action (Rejection)
    // We want to see if the current candle or recent candles are rejecting the zone
    const priceAction = analyzePriceAction(this.candles, strongestZone)
    
    // Only trade if we have a clear rejection signal
    if (!priceAction.rejection) return null

    const isBuy = strongestZone.type === 'demand'
    
    // Use zone's levels
    // Ensure we are entering within the zone or slightly better
    const entry = strongestZone.entry
    const stopLoss = strongestZone.stopLoss
    
    // Calculate take profit (2:1 RR minimum)
    const risk = Math.abs(entry - stopLoss)
    const takeProfit = isBuy 
      ? entry + (risk * 2) 
      : entry - (risk * 2)
    
    // Calculate confidence based on zone strength and liquidity
    const confidence = Math.min(
      0.9, 
      0.5 + 
      (strongestZone.strength * 0.1) + 
      (strongestZone.liquidity ? 0.2 : 0)
    )

    return {
      type: isBuy ? 'BUY' : 'SELL',
      entry,
      stopLoss,
      takeProfit,
      confidence,
      zone: strongestZone,
      liquidityHit: !!strongestZone.liquidity
    }
  }

  getZones(): SupplyDemandZone[] {
    return this.zones
  }
}
