import AdminSignals from '@/components/AdminSignals'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { getAppSecret } from '@/lib/config'
import LogoutButton from '@/components/LogoutButton'
import SystemStatus from '@/components/SystemStatus'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('tspro_token')?.value
  const secret = getAppSecret()
  let isAdmin = false
  if (token) {
    try {
      const payload = jwt.verify(token, secret) as any
      isAdmin = payload.role === 'admin'
    } catch {}
  }
  if (!isAdmin) {
    return <p className="text-sm">Access denied. Admins only.</p>
  }
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-end mb-2">
        <LogoutButton />
      </div>
      <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
      <p className="text-sm text-gray-600 mb-4">Approve and moderate signals.</p>
      <AdminSignals />
      <div className="border-t mt-6 pt-4">
        <SystemStatus />
      </div>
    </div>
  )
}
