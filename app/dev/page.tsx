import { cookies } from 'next/headers'
import DevPageClient from './DevPageClient'

const DEV_COOKIE = 'perspective_dev_auth'
const SESSION_TOKEN = 'dev-session-ok'

export default function DevPage({ searchParams }: { searchParams: { error?: string } }) {
  const cookieStore = cookies()
  const devAuth = cookieStore.get(DEV_COOKIE)?.value
  const authed = devAuth === SESSION_TOKEN

  if (!authed) {
    return <DevLoginForm error={searchParams.error} />
  }

  const appUrl = (process.env.APP_URL || 'http://localhost:3001').trim()
  const callbackUrl = process.env.TRADESTART_CALLBACK_URL || ''
  const logoutUrl = process.env.TRADESTART_LOGOUT_URL || ''

  const config = {
    appUrl,
    discoveryUrl: `${appUrl}/.well-known/openid-configuration`,
    jwksUrl: `${appUrl}/.well-known/keys`,
    authorizeUrl: `${appUrl}/authorize`,
    tokenUrl: `${appUrl}/token`,
    logoutUrl: `${appUrl}/logout`,
    clientId: '3668F1E1-677D-414F-95ED-1CC789A92A85',
    clientIdNote: 'Accept case-insensitive. Return in aud claim as lowercase.',
    redirectUri: callbackUrl,
    postLogoutRedirectUri: logoutUrl,
    responseType: 'code',
    scopes: 'openid profile email',
    codeChallengeMethod: 'S256',
    signingAlg: 'RS256',
    keyId: 'perspective-demo-key-1',
  }

  return <DevPageClient config={config} />
}

function DevLoginForm({ error }: { error?: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header style={{ backgroundColor: '#1a1a2e' }} className="px-6 py-4">
        <span className="text-white text-xl font-bold tracking-wide">Perspective</span>
        <span className="text-gray-400 text-sm ml-3">/ Developer Guide</span>
      </header>
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm w-full max-w-sm p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Developer access</h1>
          <p className="text-sm text-gray-500 mb-6">Enter the developer password to view integration details.</p>
          {error === 'wrong-password' && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              Incorrect password. Please try again.
            </div>
          )}
          {error === 'not-configured' && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-3 py-2 rounded-lg">
              Developer access is not configured on this server.
            </div>
          )}
          <form method="POST" action="/api/dev/auth" className="space-y-4">
            <input
              type="password"
              name="pw"
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              style={{ backgroundColor: '#00AEEF' }}
              className="w-full py-2 px-4 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Access guide
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
