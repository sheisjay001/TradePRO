
import { findSupplyDemandZones, SupplyDemandZone } from './src/lib/strategies/supplyDemand';
import { Candle } from './src/lib/market';

// Mock data helper
function createCandle(i: number, close: number): Candle {
    return {
        time: i * 60000,
        open: close,
        high: close + 10,
        low: close - 10,
        close: close,
        volume: 100
    };
}

// Scenario: Uptrend (Higher Highs)
// Expectation: Current logic marks Higher Highs as Supply?
const uptrendCandles: Candle[] = [];
let price = 100;
for (let i = 0; i < 50; i++) {
    price += 5; // steady uptrend
    // Create local swing high every 5 candles
    if (i % 5 === 0) {
        // Swing high
        uptrendCandles.push({
            time: i * 60000,
            open: price,
            high: price + 20, // High wick
            low: price - 5,
            close: price,
            volume: 100
        });
    } else {
         uptrendCandles.push({
            time: i * 60000,
            open: price,
            high: price + 5,
            low: price - 5,
            close: price,
            volume: 100
        });
    }
}

const zones = findSupplyDemandZones(uptrendCandles);
console.log("Uptrend Zones:", JSON.stringify(zones, null, 2));
