'use client'

import { useSearchParams } from 'next/navigation'

export default function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id')

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header style={{ backgroundColor: '#1a1a2e' }} className="px-6 py-4">
        <span className="text-white text-xl font-bold tracking-wide">Perspective</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Password Reset</h1>
          <p className="text-gray-600 text-sm mb-4">
            Password reset would be handled by the real Perspective platform.
          </p>
          {clientId && (
            <p className="text-xs text-gray-400 mb-6">
              Client ID: <span className="font-mono">{clientId}</span>
            </p>
          )}
          <a
            href="/login"
            style={{ color: '#00AEEF' }}
            className="text-sm hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </main>
    </div>
  )
}
