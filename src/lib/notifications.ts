import { readJson, writeJson } from './store'
import { DbSignal } from './db'

type QueuedNotification = {
  id: string
  ts: string
  type: 'email' | 'push' | 'inapp' | 'telegram'
  to: string
  subject?: string
  body: string
}

async function sendTelegram(text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) return
    
    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
        })
    } catch (e) {
        console.error('Telegram send error:', e)
    }
}

export async function notifySignalToAllUsers(signal: DbSignal) {
  const users = await readJson<{ id: string; email: string; role: string }[]>('users.json', [])
  const items: QueuedNotification[] = []
  
  // 1. Queue In-App & Email for Users
  for (const u of users) {
    items.push({
      id: `${Date.now()}-${u.id}`,
      ts: new Date().toISOString(),
      type: 'email',
      to: u.email,
      subject: `New ${signal.type} signal: ${signal.symbol}`,
      body: `Entry ${signal.entry}, SL ${signal.stopLoss}, TP ${Array.isArray(signal.takeProfit) ? signal.takeProfit.join(',') : signal.takeProfit}`,
    })
    items.push({
      id: `${Date.now()}-inapp-${u.id}`,
      ts: new Date().toISOString(),
      type: 'inapp',
      to: u.id,
      body: `New ${signal.type} ${signal.symbol}`,
    })
  }
  
  // 2. Send Telegram Immediately (Global Channel)
  const tgBody = `🚨 <b>NEW SIGNAL</b> 🚨\n\n` +
                 `Symbol: <b>${signal.symbol}</b>\n` +
                 `Type: <b>${signal.type}</b>\n` +
                 `Entry: ${signal.entry}\n` +
                 `SL: ${signal.stopLoss}\n` +
                 `TP: ${Array.isArray(signal.takeProfit) ? signal.takeProfit.join(' / ') : signal.takeProfit}\n` +
                 `\n<i>Manage your risk!</i>`
                 
  await sendTelegram(tgBody)

  const queue = await readJson<QueuedNotification[]>('notifications.json', [])
  queue.push(...items)
  await writeJson('notifications.json', queue)
}
