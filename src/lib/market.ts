import { config } from '@/config';

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getBinanceKlines(
  symbol: string, 
  interval: string, 
  limit = 500
): Promise<Candle[]> {
  const { apiKey } = config.api.binance;
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(apiKey && { 'X-MBX-APIKEY': apiKey })
  };

  try {
    const res = await fetch(url, { 
      headers,
      cache: 'no-cache'
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch klines: ${res.status} ${res.statusText}\n${JSON.stringify(errorData, null, 2)}` 
      );
    }

    const klines = await res.json();

    if (!Array.isArray(klines)) {
      console.warn('Unexpected response format from Binance API:', klines);
      return [];
    }

    return klines.map((k: any[]) => ({
      time: k[0],
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
    }));

  } catch (error) {
    console.error('Error in getBinanceKlines:', {
      symbol,
      interval,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}