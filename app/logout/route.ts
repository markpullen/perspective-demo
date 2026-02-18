import { NextRequest, NextResponse } from 'next/server'
import { clearSessionCookieOptions } from '@/lib/auth'

const REGISTERED_CLIENT_ID = '3668f1e1-677d-414f-95ed-1cc789a92a85'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const postLogoutRedirectUri = searchParams.get('post_logout_redirect_uri')

  // Validate client_id
  if (clientId && clientId.toLowerCase() !== REGISTERED_CLIENT_ID) {
    return new NextResponse('Invalid client_id', { status: 400 })
  }

  const cookieOptions = clearSessionCookieOptions()
  const redirectTo = postLogoutRedirectUri || ((process.env.TRADESTART_LOGOUT_URL ?? '/login').trim())

  const response = NextResponse.redirect(redirectTo)
  response.cookies.set(cookieOptions)
  return response
}
