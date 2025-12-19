'use client'
import { useState, useEffect, useRef } from 'react'

type Notification = {
  id: number
  message: string
  type: 'info' | 'success' | 'error'
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  function add(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  // Actually use ref for mutable non-rendering state
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    let sse: EventSource | null = null
    try {
      sse = new EventSource('/api/signals/stream')
      add('Connected to live signal feed', 'success')
      
      sse.addEventListener('signals', (e) => {
         try {
             const data = JSON.parse(e.data)
             const signals = data.signals
             if (signals && signals.length > 0) {
                 const newest = signals[0]
                 // Initial load
                 if (lastId.current === null) {
                     lastId.current = newest.id
                     return
                 }
                 
                 // New signal detected
                 if (newest.id !== lastId.current) {
                     lastId.current = newest.id
                     add(`New Signal: ${newest.type} ${newest.symbol} @ ${newest.entry}`, 'success')
                     // Try to play sound
                     try {
                         const audio = new Audio('/alert.mp3') // We need to ensure this file exists or use a default
                         audio.play().catch(() => {}) 
                     } catch {}
                 }
             }
         } catch (err) {
             console.error('Failed to parse signal event', err)
         }
      })

    } catch {}
    return () => sse?.close()
  }, [])

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(n => (
        <div key={n.id} className={`p-4 rounded shadow-lg text-white ${
          n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {n.message}
        </div>
      ))}
    </div>
  )
}
