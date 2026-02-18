'use client'

import { useState } from 'react'

interface Config {
  appUrl: string
  discoveryUrl: string
  jwksUrl: string
  authorizeUrl: string
  tokenUrl: string
  logoutUrl: string
  clientId: string
  clientIdNote: string
  redirectUri: string
  postLogoutRedirectUri: string
  responseType: string
  scopes: string
  codeChallengeMethod: string
  signingAlg: string
  keyId: string
}

interface TokenPreview {
  jwt: string
  header: Record<string, unknown>
  payload: Record<string, unknown>
  userprofilesRaw: string
  note: string
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="ml-2 text-xs px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function ConfigRow({ label, value, note, mono = true }: { label: string; value: string; note?: string; mono?: boolean }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-48 text-sm text-gray-500 pt-0.5">{label}</div>
        <div className="flex-1">
          <span className={`text-sm text-gray-900 break-all ${mono ? 'font-mono' : 'font-medium'}`}>{value}</span>
          <CopyButton value={value} />
          {note && <p className="text-xs text-amber-600 mt-1">{note}</p>}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-100" style={{ borderLeftWidth: 4, borderLeftColor: accent || '#00AEEF', borderLeftStyle: 'solid' }}>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="px-6">{children}</div>
    </div>
  )
}

export default function DevPageClient({ config }: { config: Config }) {
  const [tokenData, setTokenData] = useState<TokenPreview | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [showRawJwt, setShowRawJwt] = useState(false)

  async function loadTokenPreview() {
    setTokenLoading(true)
    setTokenError('')
    try {
      const res = await fetch('/api/dev/token-preview')
      if (!res.ok) {
        const d = await res.json()
        setTokenError(d.error || 'Not logged in — log in first to preview the token.')
        return
      }
      setTokenData(await res.json())
    } catch {
      setTokenError('Request failed.')
    } finally {
      setTokenLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header style={{ backgroundColor: '#1a1a2e' }} className="px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-white text-xl font-bold tracking-wide">Perspective</span>
          <span className="text-gray-400 text-sm ml-3">/ OIDC Integration Guide</span>
        </div>
        <a href="/login" className="text-xs text-gray-400 hover:text-gray-200 border border-gray-600 px-3 py-1.5 rounded-lg transition-colors">
          Go to app
        </a>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Intro */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Perspective IdP → TradeStart SSO</h1>
          <p className="text-sm text-gray-600 max-w-3xl">
            This guide is for the <strong>Perspective platform developer (Insula)</strong> to implement OIDC SSO with the TradeStart Rewards portal (Novus Loyalty).
            The Perspective platform acts as the <strong>Identity Provider (IdP)</strong>. Novus TradeStart is the <strong>Service Provider (SP / Relying Party)</strong>.
          </p>
        </div>

        {/* Flow Diagram */}
        <Section title="SSO Flow — Authorization Code + PKCE" accent="#00AEEF">
          <div className="py-4">
            <pre className="text-xs leading-relaxed text-gray-700 overflow-x-auto font-mono bg-gray-50 rounded-lg p-4">{`
  Subcontractor Browser          Perspective IdP                  Novus TradeStart
         │                             │                                │
         │  1. Already logged into     │                                │
         │     Perspective dashboard   │                                │
         │                             │                                │
         │  2. Clicks "Go to           │                                │
         │     TradeStart Rewards" ────────────────────────────────────►│
         │                             │                                │
         │                             │  3. GET /authorize?            │
         │                             │◄──── client_id=...             │
         │                             │      code_challenge=...        │
         │                             │      state=...                 │
         │                             │      nonce=...                 │
         │                             │                                │
         │                             │  4. Check perspective_session  │
         │                             │     cookie — user already      │
         │                             │     logged in → skip login     │
         │                             │                                │
         │                             │  5. Generate auth code (UUID)  │
         │                             │     Store: code_challenge,     │
         │                             │     nonce, userId (60s TTL)    │
         │                             │                                │
         │                             │  6. Redirect to callback ──────►
         │                             │     ?code=xxx&state=xxx        │
         │                             │                                │
         │                             │  7. POST /token                │
         │                             │◄──── code=xxx                  │
         │                             │      code_verifier=...         │
         │                             │      client_id=...             │
         │                             │                                │
         │                             │  8. Verify PKCE, lookup user,  │
         │                             │     sign RS256 JWT (15 min)    │
         │                             │                                │
         │                             │  9. Return { id_token } ──────►│
         │                             │                                │
         │◄──────────────────────────── 10. Redirect to portal ─────────│
         │     (user is now in         │     with session established   │
         │      TradeStart as          │                                │
         │      John Smith / SMIBRIC)  │                                │
`}</pre>
            <p className="text-xs text-gray-500 mt-2">
              Step 2 goes to <code className="bg-gray-100 px-1 rounded">/api/auth/sso/authorize?tenant=tradestart</code> on Novus, which initiates the OIDC flow back to Perspective.
            </p>
          </div>
        </Section>

        {/* OIDC Endpoints */}
        <Section title="OIDC Endpoints" accent="#00AEEF">
          <ConfigRow label="Discovery Document" value={config.discoveryUrl} />
          <ConfigRow label="JWKS (Public Keys)" value={config.jwksUrl} />
          <ConfigRow label="Authorization Endpoint" value={config.authorizeUrl} />
          <ConfigRow label="Token Endpoint" value={config.tokenUrl} />
          <ConfigRow label="End Session Endpoint" value={config.logoutUrl} />
        </Section>

        {/* Registered Client */}
        <Section title="Registered Client — Novus TradeStart" accent="#FEC467">
          <ConfigRow label="client_id" value={config.clientId} note={config.clientIdNote} />
          <ConfigRow label="redirect_uri" value={config.redirectUri} note="Must match exactly — no trailing slash, no query string." />
          <ConfigRow label="post_logout_redirect_uri" value={config.postLogoutRedirectUri} />
          <ConfigRow label="response_type" value={config.responseType} />
          <ConfigRow label="scopes" value={config.scopes} />
          <ConfigRow label="code_challenge_method" value={config.codeChallengeMethod} />
        </Section>

        {/* ID Token */}
        <Section title="ID Token — Required Claims" accent="#00AEEF">
          <div className="py-3 text-sm text-gray-600 border-b border-gray-100">
            Signed with <strong>RS256</strong>. 15 minute expiry (<code className="bg-gray-100 px-1 rounded">exp = iat + 900</code>).
            The <code className="bg-gray-100 px-1 rounded">expires_in</code> value in the /token response must be <strong>9000</strong>.
          </div>
          <table className="w-full text-sm mt-3 mb-3">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 font-medium w-40">Claim</th>
                <th className="pb-2 font-medium w-48">Value</th>
                <th className="pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { claim: 'iss', value: config.appUrl, note: 'Must match the issuer in the discovery document.' },
                { claim: 'aud', value: '3668f1e1-677d-414f-95ed-1cc789a92a85', note: 'MUST be lowercase. Novus validates case-sensitively.' },
                { claim: 'sub', value: 'ContactId (UUID)', note: "User's ContactId from Perspective." },
                { claim: 'unique_name', value: 'email address', note: "User's email." },
                { claim: 'email', value: 'email address', note: "User's email (same as unique_name)." },
                { claim: 'nonce', value: '(from /authorize)', note: 'Must echo back the nonce from the authorization request.' },
                { claim: 'iat', value: 'Unix timestamp', note: 'Issued at time.' },
                { claim: 'exp', value: 'iat + 900', note: '15 minute token lifetime.' },
                { claim: 'userprofiles', value: 'JSON string', note: 'CRITICAL: Must be JSON.stringify() of the profile object — a string, not an object.' },
              ].map(r => (
                <tr key={r.claim} className="py-2">
                  <td className="py-2 font-mono text-gray-900">{r.claim}</td>
                  <td className="py-2 font-mono text-gray-600 text-xs">{r.value}</td>
                  <td className="py-2 text-gray-600 text-xs">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* userprofiles claim */}
        <Section title="The userprofiles Claim — Critical Detail" accent="#ef4444">
          <div className="py-4 space-y-3 text-sm text-gray-700">
            <p>
              The <code className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono">userprofiles</code> claim is the most important field.
              Novus uses it to identify the subcontractor and link them to their rewards history via <strong>OrganisationAlternateKey</strong> (the Vendor ID).
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-semibold text-amber-800 mb-1">It must be a JSON string, not a JSON object.</p>
              <p className="text-amber-700 text-xs">
                Place <code>JSON.stringify(profileObject)</code> as the claim value. The real PSTPF IdP does this — Novus expects a string and will parse it server-side.
              </p>
            </div>
            <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto font-mono">{`// Correct — userprofiles is a STRING in the JWT payload:
{
  "iss": "${config.appUrl}",
  "aud": "3668f1e1-677d-414f-95ed-1cc789a92a85",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "userprofiles": "{\\"ContactId\\":\\"a1b2c3d4...\\",\\"ContactFullName\\":\\"John Smith\\",\\"Organisations\\":[{\\"OrganisationAlternateKey\\":\\"SMIBRIC\\"}],...}"
}

// Wrong — do NOT put an object:
{
  "userprofiles": { "ContactId": "...", ... }  // ← this will break Novus
}`}</pre>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-2">Full userprofiles object structure:</p>
              <pre className="text-xs text-gray-700 font-mono overflow-x-auto">{`{
  "ContactId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",   // UUID
  "ContactFullName": "John Smith",
  "FirstNames": "John",
  "Surname": "Smith",
  "EmailAddress": "john@smithbricklaying.com.au",
  "MobileNumber": "0412345678",
  "ContactPostalAddress": {
    "AddressLineOne": "45 Builder Lane",
    "AddressLineTwo": "",
    "Suburb": "Penrith",
    "Poscode": "2750",                                     // Note: typo is intentional (not Postcode)
    "FullAddress": "45 Builder Lane, Penrith 2750"
  },
  "Organisations": [
    {
      "OrganisationContactId": "e5f6a7b8-c9d0-1234-5678-9abcdef01234",
      "OrganisationFullName": "Smith Bricklaying Pty Ltd",
      "TradingName": "Smith Bricklaying",
      "ABN": "12345678901",
      "OrganisationAlternateKey": "SMIBRIC"               // ← Vendor ID — links to TradeStart
    }
  ]
}`}</pre>
            </div>
          </div>
        </Section>

        {/* Live Token Preview */}
        <Section title="Live Token Preview" accent="#8b5cf6">
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Log in to the Perspective app first, then click below to generate a real signed ID token for that user and see exactly what Novus receives.
            </p>
            <button
              onClick={loadTokenPreview}
              disabled={tokenLoading}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#8b5cf6' }}
            >
              {tokenLoading ? 'Generating...' : 'Generate Token Preview'}
            </button>
            {tokenError && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {tokenError} — <a href="/login" className="underline">Log in here</a>
              </div>
            )}
            {tokenData && (
              <div className="mt-4 space-y-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">JWT Header</span>
                  </div>
                  <pre className="text-xs text-gray-800 font-mono overflow-x-auto">{JSON.stringify(tokenData.header, null, 2)}</pre>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">JWT Payload (decoded)</span>
                    <span className="text-xs text-gray-400">userprofiles expanded for readability</span>
                  </div>
                  <pre className="text-xs text-gray-800 font-mono overflow-x-auto">{JSON.stringify(tokenData.payload, null, 2)}</pre>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">userprofiles — as stored in JWT (raw string)</span>
                    <CopyButton value={tokenData.userprofilesRaw} />
                  </div>
                  <pre className="text-xs text-gray-600 font-mono overflow-x-auto break-all whitespace-pre-wrap">{tokenData.userprofilesRaw}</pre>
                </div>
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Raw Signed JWT</span>
                    <div className="flex items-center gap-2">
                      <CopyButton value={tokenData.jwt} />
                      <button
                        onClick={() => setShowRawJwt(v => !v)}
                        className="text-xs text-gray-400 hover:text-gray-200"
                      >
                        {showRawJwt ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  {showRawJwt && (
                    <p className="text-xs text-green-300 font-mono break-all">{tokenData.jwt}</p>
                  )}
                  {!showRawJwt && (
                    <p className="text-xs text-gray-500">Click Show to reveal. Paste into jwt.io to inspect.</p>
                  )}
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {tokenData.note}
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Test Users */}
        <Section title="Test Users" accent="#00AEEF">
          <div className="py-3 text-sm text-gray-600 mb-2">All passwords: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono font-semibold">Demo1234!</code></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Vendor ID</th>
                  <th className="pb-2 font-medium">Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'John Smith', email: 'john@smithbricklaying.com.au', vendorId: 'SMIBRIC', trade: 'Bricklayer' },
                  { name: 'Sarah Chen', email: 'sarah@chenpaint.com.au', vendorId: 'PLWPAIN', trade: 'Painter' },
                  { name: 'David Wilson', email: 'david@wilsonframes.com.au', vendorId: 'FEIDAPA', trade: 'Frame Carpenter' },
                  { name: 'Demo Admin', email: 'admin@perspective-demo.com', vendorId: 'DEMADM', trade: 'Admin' },
                ].map(u => (
                  <tr key={u.email}>
                    <td className="py-2 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2 font-mono text-xs text-gray-600">{u.email}</td>
                    <td className="py-2 font-mono font-semibold text-gray-900">{u.vendorId}</td>
                    <td className="py-2 text-gray-500">{u.trade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <footer className="text-center text-xs text-gray-400 pb-8">
          Perspective Demo IdP — for integration testing only. Not for production use.
        </footer>
      </main>
    </div>
  )
}
