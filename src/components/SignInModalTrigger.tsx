'use client'
import Link from 'next/link'

export default function SignInModalTrigger() {
  return (
    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
      <span>Already a member?</span>
      <Link
        href="/login"
        className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        Sign in
      </Link>
    </div>
  )
}
