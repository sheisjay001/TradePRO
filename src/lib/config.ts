import { readJson } from './store'

export type RiskConfig = {
  minRR: number
  riskProfile: 'conservative' | 'balanced' | 'aggressive'
  dailyLimit: number
}

const profileToMinRR: Record<RiskConfig['riskProfile'], number> = {
  conservative: 2.0,
  balanced: 1.5,
  aggressive: 1.2,
}

export async function getRiskConfig(): Promise<RiskConfig> {
  const fileCfg = await readJson<RiskConfig>('config.json', {
    minRR: 1.5,
    riskProfile: 'balanced',
    dailyLimit: 10,
  })
  const profile = (process.env.RISK_PROFILE as RiskConfig['riskProfile']) || fileCfg.riskProfile
  const envMinRR = process.env.MIN_RR ? Number(process.env.MIN_RR) : undefined
  const minRR = envMinRR ?? profileToMinRR[profile] ?? fileCfg.minRR
  const dailyLimit = process.env.DAILY_LIMIT ? Number(process.env.DAILY_LIMIT) : fileCfg.dailyLimit
  return { minRR, riskProfile: profile, dailyLimit }
}

export function getAppSecret(): string {
  return process.env.APP_SECRET || 'dev-secret-fallback-123456'
}
