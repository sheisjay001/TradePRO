import Link from 'next/link'
import RegisterForm from '@/components/RegisterForm'
import SignInModalTrigger from '@/components/SignInModalTrigger'

export default function HomePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <section className="relative overflow-hidden rounded-2xl p-8 text-white shadow-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Actionable <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Trading Signals</span>
          </h1>
          <p className="mt-4 text-slate-300 text-lg leading-relaxed">
            TradeSignal Pro delivers curated <span className="text-amber-400 font-semibold">BUY/SELL</span> ideas with precision entries.
            Built-in risk checks keep you disciplined. Live updates stream opportunities in real time.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Feature 1: Risk - Gold Theme */}
            <div className="group relative p-[1px] rounded-xl bg-gradient-to-br from-amber-400/50 to-yellow-600/50 hover:from-amber-400 hover:to-yellow-600 transition-all duration-300">
              <div className="relative h-full bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 border border-white/5">
                <div className="w-10 h-10 mb-3 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <p className="font-bold text-amber-100">Risk-aware entries</p>
                <p className="text-sm text-slate-400 mt-1">Signals pass strict minimum RR filters.</p>
              </div>
            </div>

            {/* Feature 2: Live - Purple Theme */}
            <div className="group relative p-[1px] rounded-xl bg-gradient-to-br from-purple-400/50 to-indigo-600/50 hover:from-purple-400 hover:to-indigo-600 transition-all duration-300">
              <div className="relative h-full bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 border border-white/5">
                <div className="w-10 h-10 mb-3 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <p className="font-bold text-purple-100">Live updates</p>
                <p className="text-sm text-slate-400 mt-1">New opportunities stream in instantly.</p>
              </div>
            </div>

            {/* Feature 3: Management - Blue Theme */}
            <div className="group relative p-[1px] rounded-xl bg-gradient-to-br from-blue-400/50 to-cyan-600/50 hover:from-blue-400 hover:to-cyan-600 transition-all duration-300">
              <div className="relative h-full bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 border border-white/5">
                <div className="w-10 h-10 mb-3 rounded-lg bg-blue-500/10 flex items-center justify-center">
                   <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <p className="font-bold text-blue-100">Simple management</p>
                <p className="text-sm text-slate-400 mt-1">Clear SL/TP with daily limits.</p>
              </div>
            </div>

            {/* Feature 4: Markets - Gold/Blue Mix */}
            <div className="group relative p-[1px] rounded-xl bg-gradient-to-br from-indigo-400/50 to-amber-500/50 hover:from-indigo-400 hover:to-amber-500 transition-all duration-300">
              <div className="relative h-full bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 border border-white/5">
                <div className="w-10 h-10 mb-3 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                   <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="font-bold text-indigo-100">Multiple markets</p>
                <p className="text-sm text-slate-400 mt-1">Forex, Crypto, Indices.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative rounded-2xl shadow-xl p-8 bg-white border border-slate-100">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-amber-100/40 via-purple-100/40 to-blue-100/40 opacity-50 blur-xl" />
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Create your account</h2>
        <p className="text-slate-500 mb-6">Join thousands of disciplined traders.</p>
        
        <div className="bg-white/50 backdrop-blur-sm rounded-xl">
           <RegisterForm />
        </div>
        
        <p className="text-xs mt-6 text-slate-500 text-center">
          By creating an account you agree to our{' '}
          <Link href="#" className="text-indigo-600 hover:text-indigo-800 underline">Terms</Link> and{' '}
          <Link href="#" className="text-indigo-600 hover:text-indigo-800 underline">Privacy Policy</Link>.
        </p>
        <div className="mt-6 pt-6 border-t border-slate-100">
            <SignInModalTrigger />
        </div>
      </section>
    </div>
  )
}
