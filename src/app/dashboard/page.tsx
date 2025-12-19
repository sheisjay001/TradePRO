import DashboardChart from '@/components/DashboardChart'
import SignalsList from '@/components/SignalsList'
import Stats from '@/components/Stats'
import Notifications from '@/components/Notifications'
import LogoutButton from '@/components/LogoutButton'
import Watchlist from '@/components/Watchlist'

export default function DashboardPage() {
  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <LogoutButton />
      </div>
      <Notifications />
      <Stats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <DashboardChart />
        </section>
        <section className="lg:col-span-1 flex flex-col gap-8">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Active Signals</h2>
            <SignalsList />
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Signal History</h2>
            <SignalsList showHistory={true} />
          </div>
          <Watchlist />
        </section>
      </div>
    </div>
  )
}
