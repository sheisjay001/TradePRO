'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        // Redirect to login page
        router.push('/login')
      } else {
        const data = await res.json().catch(() => ({}))
        setMsg(data?.error ?? 'Registration failed')
        setLoading(false)
      }
    } catch (err) {
      setMsg('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
        <input 
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" 
          type="email" 
          placeholder="you@example.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input 
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" 
          type="password" 
          placeholder="Min 8 characters" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          minLength={8} 
          required 
        />
      </div>
      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-slate-800 hover:to-indigo-800 text-white font-medium rounded-lg px-4 py-3 shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>
      {msg && (
        <div className={`p-3 rounded-lg text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          {msg}
        </div>
      )}
    </form>
  )
}
