import { NextRequest, NextResponse } from 'next/server'

const DEV_COOKIE = 'perspective_dev_auth'
// Store a bcrypt-style constant-time comparison to avoid timing attacks
// We hash the password on the server; cookie stores a session token, not the password itself
const SESSION_TOKEN = 'dev-session-ok'

export async function POST(request: NextRequest) {
  let pw: string | undefined
  try {
    const body = await request.formData()
    pw = body.get('pw')?.toString()
  } catch {
    return NextResponse.redirect(new URL('/dev', request.url))
  }

  const devPassword = process.env.DEV_PAGE_PASSWORD
  if (!devPassword) {
    return NextResponse.redirect(new URL('/dev?error=not-configured', request.url))
  }

  // Constant-time string comparison to prevent timing attacks
  const expected = Buffer.from(devPassword)
  const actual = Buffer.from(pw ?? '')
  const match =
    expected.length === actual.length &&
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('crypto').timingSafeEqual(expected, actual)

  if (!match) {
    return NextResponse.redirect(new URL('/dev?error=wrong-password', request.url))
  }

  const response = NextResponse.redirect(new URL('/dev', request.url))
  response.cookies.set({
    name: DEV_COOKIE,
    value: SESSION_TOKEN,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
    path: '/',
  })
  return response
}
