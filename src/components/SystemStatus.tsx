'use client'
import { useEffect, useState } from 'react'

export default function SystemStatus() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetch('/api/system/status')
      const json = await res.json().catch(() => ({}))
      setData(json)
      setLoading(false)
    }
    load()
  }, [])
  if (loading) return <p className="text-sm">Loading system status...</p>
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">System Status</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-3">
          <p className="text-gray-500">Users</p>
          <p className="font-bold">{data?.users ?? 0}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-gray-500">Admins</p>
          <p className="font-bold">{data?.admins ?? 0}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-gray-500">Signals</p>
          <p className="font-bold">{data?.signals ?? 0}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-gray-500">Audit Logs</p>
          <p className="font-bold">{data?.audits ?? 0}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-gray-500">Queued Notifications</p>
          <p className="font-bold">{data?.notificationsQueued ?? 0}</p>
        </div>
      </div>
    </div>
  )
}
