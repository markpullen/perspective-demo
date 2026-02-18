import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { SignJWT } from 'jose'
import { consumeAuthCode } from '@/lib/auth-codes'
import { findUserById } from '@/lib/users'
import { getKeyPair } from '@/lib/keys'

const REGISTERED_CLIENT_ID = '3668f1e1-677d-414f-95ed-1cc789a92a85'

function errorResponse(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status })
}

function verifyPkce(codeVerifier: string, storedCodeChallenge: string): boolean {
  const expected = createHash('sha256').update(codeVerifier).digest('base64url')
  return expected === storedCodeChallenge
}

export async function POST(request: NextRequest) {
  let body: URLSearchParams
  try {
    const text = await request.text()
    body = new URLSearchParams(text)
  } catch {
    return errorResponse('invalid_request', 'Could not parse request body.')
  }

  const grantType = body.get('grant_type')
  const code = body.get('code')
  const redirectUri = body.get('redirect_uri')
  const clientId = body.get('client_id')
  const codeVerifier = body.get('code_verifier')

  if (grantType !== 'authorization_code') {
    return errorResponse('invalid_request', 'grant_type must be authorization_code.')
  }

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return errorResponse('invalid_request', 'Missing required parameters.')
  }

  if (clientId.toLowerCase() !== REGISTERED_CLIENT_ID) {
    return errorResponse('unauthorized_client', 'Unknown client_id.')
  }

  const authCodeData = consumeAuthCode(code)
  if (!authCodeData) {
    return errorResponse('invalid_grant', 'The authorisation code has expired.')
  }

  if (authCodeData.clientId.toLowerCase() !== clientId.toLowerCase()) {
    return errorResponse('unauthorized_client', 'client_id mismatch.')
  }

  if (authCodeData.redirectUri !== redirectUri) {
    return errorResponse('invalid_request', 'redirect_uri mismatch.')
  }

  if (!verifyPkce(codeVerifier, authCodeData.codeChallenge)) {
    return errorResponse('invalid_code_verifier', 'The code verifier does not match the code challenge.')
  }

  const user = findUserById(authCodeData.userId)
  if (!user) {
    return errorResponse('invalid_grant', 'User not found.')
  }

  const { privateKey } = await getKeyPair()
  const appUrl = (process.env.APP_URL || 'http://localhost:3001').trim()
  const now = Math.floor(Date.now() / 1000)

  const userprofilesObj = user.profile
  const userprofilesStr = JSON.stringify(userprofilesObj)

  const idToken = await new SignJWT({
    iss: appUrl,
    aud: REGISTERED_CLIENT_ID, // lowercase per spec
    sub: user.profile.ContactId,
    unique_name: user.email,
    email: user.email,
    nonce: authCodeData.nonce,
    iat: now,
    exp: now + 900, // 15 minutes
    userprofiles: userprofilesStr,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: 'perspective-demo-key-1' })
    .sign(privateKey)

  return NextResponse.json({
    id_token: idToken,
    token_type: 'Bearer',
    expires_in: 9000,
    scope: 'openid profile email',
  })
}
