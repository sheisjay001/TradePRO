// Environment Configuration
// This file centralizes all environment variables and provides type-safe access to them

interface BinanceConfig {
  apiKey: string;
  secretKey: string;
}

interface ApiConfig {
  baseUrl: string;
  alphaVantageKey: string;
  binance: BinanceConfig;
}

interface AuthConfig {
  secret: string;
  url: string;
}

interface AppConfig {
  env: string;
  isProduction: boolean;
}

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com',
    alphaVantageKey: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY || '',
    binance: {
      apiKey: process.env.NEXT_PUBLIC_BINANCE_API_KEY || '',
      secretKey: process.env.NEXT_PUBLIC_BINANCE_SECRET_KEY || '',
    },
  } as ApiConfig,
  
  app: {
    env: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  } as AppConfig,
  
  auth: {
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  } as AuthConfig,
};

// Type exports for better type safety
export type { ApiConfig, AuthConfig, AppConfig, BinanceConfig };

// Helper function to validate required environment variables
export function validateEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_ALPHA_VANTAGE_KEY',
  ];

  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] && !process.env[`NEXT_PUBLIC_${varName}`]
  );

  if (missingVars.length > 0) {
    console.warn('Missing required environment variables:', missingVars.join(', '));
    return false;
  }
  
  return true;
}

// Validate environment on application start
if (typeof window === 'undefined') {
  validateEnvironment();
}
