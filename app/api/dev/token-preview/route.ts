import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { getSession } from '@/lib/auth'
import { findUserById } from '@/lib/users'
import { getKeyPair } from '@/lib/keys'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const user = findUserById(session.userId)
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { privateKey } = await getKeyPair()
  const appUrl = (process.env.APP_URL || 'http://localhost:3001').trim()
  const now = Math.floor(Date.now() / 1000)
  const REGISTERED_CLIENT_ID = '3668f1e1-677d-414f-95ed-1cc789a92a85'

  const userprofilesObj = user.profile
  const userprofilesStr = JSON.stringify(userprofilesObj)

  const claims = {
    iss: appUrl,
    aud: REGISTERED_CLIENT_ID,
    sub: user.profile.ContactId,
    unique_name: user.email,
    email: user.email,
    nonce: 'preview-nonce-not-for-production',
    iat: now,
    exp: now + 900,
    userprofiles: userprofilesStr,
  }

  const idToken = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: 'perspective-demo-key-1' })
    .sign(privateKey)

  // Decode for display (base64url decode each part)
  const [headerB64, payloadB64] = idToken.split('.')
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString())
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())

  // Parse userprofiles string back to object for readable display
  const payloadReadable = {
    ...payload,
    userprofiles: JSON.parse(payload.userprofiles),
  }

  return NextResponse.json({
    jwt: idToken,
    header,
    payload: payloadReadable,
    userprofilesRaw: userprofilesStr,
    note: 'This token uses a preview nonce. Real tokens use the nonce from the /authorize request.',
  })
}
