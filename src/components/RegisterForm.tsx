'use client'
import { useState } from 'react'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      setMsg('Registered successfully. You can now sign in.')
      setEmail('')
      setPassword('')
    } else {
      const data = await res.json().catch(() => ({}))
      setMsg(data?.error ?? 'Registration failed')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      <button className="bg-blue-600 text-white rounded px-4 py-2">Create account</button>
      {msg && <p className="text-sm mt-2">{msg}</p>}
    </form>
  )
}
