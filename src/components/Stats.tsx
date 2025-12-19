'use client'
import { useState, useEffect } from 'react'

export default function Stats() {
  const [stats, setStats] = useState({ wins: 0, losses: 0, winRate: 0, active: 0, riskExposure: 0 })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/signals')
        let data: any = {}
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        const signals = data.signals || []
        const history = signals.filter((s: any) => s.status === 'CLOSED')
        const active = signals.filter((s: any) => s.status === 'ACTIVE')
        const wins = history.filter((s: any) => s.result === 'WIN').length
        const losses = history.filter((s: any) => s.result === 'LOSS').length
        const total = wins + losses
        const riskExposure = active.length * 1
        setStats({
          wins,
          losses,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
          active: active.length,
          riskExposure,
        })
      } catch {
        setStats({ wins: 0, losses: 0, winRate: 0, active: 0, riskExposure: 0 })
      }
    }
    load()
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
       <div className="bg-white p-4 rounded shadow text-center">
         <p className="text-gray-500 text-sm">Win Rate</p>
         <p className="text-2xl font-bold text-blue-600">{stats.winRate}%</p>
       </div>
       <div className="bg-white p-4 rounded shadow text-center">
         <p className="text-gray-500 text-sm">Wins</p>
         <p className="text-2xl font-bold text-green-600">{stats.wins}</p>
       </div>
       <div className="bg-white p-4 rounded shadow text-center">
         <p className="text-gray-500 text-sm">Losses</p>
         <p className="text-2xl font-bold text-red-600">{stats.losses}</p>
       </div>
       <div className="bg-white p-4 rounded shadow text-center">
         <p className="text-gray-500 text-sm">Active Trades</p>
         <p className="text-2xl font-bold text-purple-600">{stats.active}</p>
       </div>
       <div className="bg-white p-4 rounded shadow text-center">
         <p className="text-gray-500 text-sm">Risk Exposure</p>
         <p className="text-2xl font-bold text-orange-600">{stats.riskExposure}%</p>
       </div>
    </div>
  )
}
