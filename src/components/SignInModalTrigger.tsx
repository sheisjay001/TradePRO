'use client'
import { useState } from 'react'
import LoginForm from './LoginForm'
import Link from 'next/link'

export default function SignInModalTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
        <span>Already a member?</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Sign in
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Sign in</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-sm bg-gray-100"
              >
                Close
              </button>
            </div>
            <LoginForm />
            <p className="text-xs mt-4 text-center text-slate-500">
              By continuing you agree to our{' '}
              <Link href="#" className="text-indigo-600 hover:text-indigo-800 hover:underline">Terms</Link> and{' '}
              <Link href="#" className="text-indigo-600 hover:text-indigo-800 hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
