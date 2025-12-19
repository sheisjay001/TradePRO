'use client'
import { useState } from 'react'
import LoginForm from './LoginForm'
import Link from 'next/link'

export default function SignInModalTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <p className="text-sm mt-4">
        Already a member?{' '}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="underline text-blue-600"
        >
          Sign in
        </button>
      </p>
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
            <p className="text-xs mt-3 text-gray-600">
              By continuing you agree to our{' '}
              <Link href="#" className="underline">Terms</Link> and{' '}
              <Link href="#" className="underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
