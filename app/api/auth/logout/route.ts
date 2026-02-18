import { NextResponse } from 'next/server'
import { clearSessionCookieOptions } from '@/lib/auth'

export async function POST() {
  const cookieOpts = clearSessionCookieOptions()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieOpts)
  return response
}
