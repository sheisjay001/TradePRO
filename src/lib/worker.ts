import { scanAndMaybeGenerate } from './auto'
import { monitorActiveSignals } from './monitor'
import { writeJson, readJson } from './store'

let started = false
let interval: NodeJS.Timeout | null = null

export async function startAutoWorker() {
  if (started) return { started: true }
  started = true
  await writeJson('workers.json', { autoWorkerStartedAt: new Date().toISOString() })
  
  // Run immediately
  await scanAndMaybeGenerate()
  await monitorActiveSignals()

  interval = setInterval(async () => {
    const ok = await scanAndMaybeGenerate()
    await monitorActiveSignals()
    
    const state = await readJson<any>('workers.json', {})
    state.lastRunAt = new Date().toISOString()
    state.lastGenerated = ok
    await writeJson('workers.json', state)
  }, 3 * 60 * 1000) // Every 3 minutes
  return { started: true }
}

export function getWorkerState() {
  return readJson<any>('workers.json', {})
}
