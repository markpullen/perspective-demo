import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { getSessionFromToken, COOKIE_NAME } from '@/lib/auth'
import { storeAuthCode } from '@/lib/auth-codes'

const REGISTERED_CLIENT_ID = '3668f1e1-677d-414f-95ed-1cc789a92a85'

function errorRedirect(redirectUri: string, error: string, description: string, state?: string) {
  const url = new URL(redirectUri)
  url.searchParams.set('error', error)
  url.searchParams.set('error_description', description)
  if (state) url.searchParams.set('state', state)
  return NextResponse.redirect(url.toString())
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const responseType = searchParams.get('response_type')
  const clientId = searchParams.get('client_id')
  const redirectUri = searchParams.get('redirect_uri')
  const scope = searchParams.get('scope')
  const state = searchParams.get('state')
  const nonce = searchParams.get('nonce')
  const codeChallenge = searchParams.get('code_challenge')
  const codeChallengeMethod = searchParams.get('code_challenge_method')

  const registeredRedirectUri = process.env.TRADESTART_CALLBACK_URL

  // Validate redirect_uri first (before using it for error redirects)
  if (!redirectUri || redirectUri !== registeredRedirectUri) {
    return new NextResponse('Invalid redirect_uri', { status: 400 })
  }

  // Validate response_type
  if (responseType !== 'code') {
    return errorRedirect(redirectUri, 'unsupported_response_type', 'Only response_type=code is supported.', state ?? undefined)
  }

  // Validate client_id
  if (!clientId || clientId.toLowerCase() !== REGISTERED_CLIENT_ID) {
    return errorRedirect(redirectUri, 'unauthorized_client', 'Unknown client_id.', state ?? undefined)
  }

  // Validate scope
  if (!scope || !scope.includes('openid')) {
    return errorRedirect(redirectUri, 'invalid_request', 'scope must include openid.', state ?? undefined)
  }

  // Validate state
  if (!state || state.length > 1024) {
    return errorRedirect(redirectUri, 'invalid_request', 'state is required and must be <= 1024 chars.', state ?? undefined)
  }

  // Validate nonce
  if (!nonce || nonce.length > 256) {
    return errorRedirect(redirectUri, 'invalid_request', 'nonce is required and must be <= 256 chars.', state ?? undefined)
  }

  // Validate PKCE
  if (!codeChallenge || codeChallenge.length < 43 || codeChallenge.length > 128) {
    return errorRedirect(redirectUri, 'invalid_request', 'code_challenge is required (43-128 chars).', state ?? undefined)
  }
  if (codeChallengeMethod !== 'S256') {
    return errorRedirect(redirectUri, 'invalid_request', 'code_challenge_method must be S256.', state ?? undefined)
  }

  // Check for existing session (silent SSO)
  const cookieStore = cookies()
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value

  if (sessionToken) {
    const session = await getSessionFromToken(sessionToken)
    if (session) {
      // User is already logged in — issue auth code immediately
      const code = randomUUID()
      storeAuthCode(code, {
        codeChallenge,
        redirectUri,
        clientId: clientId.toLowerCase(),
        nonce,
        userId: session.userId,
      })

      const callbackUrl = new URL(redirectUri)
      callbackUrl.searchParams.set('code', code)
      callbackUrl.searchParams.set('state', state)
      return NextResponse.redirect(callbackUrl.toString())
    }
  }

  // Not logged in — redirect to login page with OIDC params
  const loginUrl = new URL('/login', process.env.APP_URL || 'http://localhost:3001')
  loginUrl.searchParams.set('response_type', responseType)
  loginUrl.searchParams.set('client_id', clientId)
  loginUrl.searchParams.set('redirect_uri', redirectUri)
  loginUrl.searchParams.set('scope', scope)
  loginUrl.searchParams.set('state', state)
  loginUrl.searchParams.set('nonce', nonce)
  loginUrl.searchParams.set('code_challenge', codeChallenge)
  loginUrl.searchParams.set('code_challenge_method', codeChallengeMethod)

  return NextResponse.redirect(loginUrl.toString())
}
