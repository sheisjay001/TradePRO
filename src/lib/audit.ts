import { writeJson, readJson } from './store'

type AuditEntry = {
  id: string
  ts: string
  action: string
  userId?: string
  meta?: any
}

export async function addAudit(action: string, meta?: any, userId?: string) {
  const logs = await readJson<AuditEntry[]>('audit.json', [])
  logs.push({ id: Date.now().toString(), ts: new Date().toISOString(), action, userId, meta })
  await writeJson('audit.json', logs)
}
