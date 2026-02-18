import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { findUserByEmail, verifyPassword } from '@/lib/users'
import { createSession, sessionCookieOptions } from '@/lib/auth'
import { storeAuthCode } from '@/lib/auth-codes'

const REGISTERED_CLIENT_ID = '3668f1e1-677d-414f-95ed-1cc789a92a85'

interface OidcParams {
  response_type: string
  client_id: string
  redirect_uri: string
  scope: string
  state: string
  nonce: string
  code_challenge: string
  code_challenge_method: string
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; oidcParams?: OidcParams }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { email, password, oidcParams } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const user = findUserByEmail(email)
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  // Create session JWT
  const sessionToken = await createSession({ userId: user.id, email: user.email })
  const cookieOpts = sessionCookieOptions(sessionToken)

  // If OIDC flow, issue auth code and redirect back to RP
  if (oidcParams && oidcParams.client_id) {
    const registeredRedirectUri = process.env.TRADESTART_CALLBACK_URL?.trim()

    if (
      oidcParams.client_id.toLowerCase() !== REGISTERED_CLIENT_ID ||
      oidcParams.redirect_uri !== registeredRedirectUri
    ) {
      return NextResponse.json({ error: 'Invalid OIDC parameters.' }, { status: 400 })
    }

    const code = randomUUID()
    storeAuthCode(code, {
      codeChallenge: oidcParams.code_challenge,
      redirectUri: oidcParams.redirect_uri,
      clientId: oidcParams.client_id.toLowerCase(),
      nonce: oidcParams.nonce,
      userId: user.id,
    })

    const callbackUrl = new URL(oidcParams.redirect_uri)
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('state', oidcParams.state)

    const response = NextResponse.json({ redirectTo: callbackUrl.toString() })
    response.cookies.set(cookieOpts)
    return response
  }

  // Regular login — redirect to dashboard
  const response = NextResponse.json({ redirectTo: '/dashboard' })
  response.cookies.set(cookieOpts)
  return response
}
