import { scanAndMaybeGenerate } from './auto'
import { writeJson, readJson } from './store'

let started = false
let interval: NodeJS.Timer | null = null

export async function startAutoWorker() {
  if (started) return { started: true }
  started = true
  await writeJson('workers.json', { autoWorkerStartedAt: new Date().toISOString() })
  interval = setInterval(async () => {
    const ok = await scanAndMaybeGenerate()
    const state = await readJson<any>('workers.json', {})
    state.lastRunAt = new Date().toISOString()
    state.lastGenerated = ok
    await writeJson('workers.json', state)
  }, 3 * 60 * 1000)
  return { started: true }
}

export function getWorkerState() {
  return readJson<any>('workers.json', {})
}
