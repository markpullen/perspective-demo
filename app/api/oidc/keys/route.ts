import { NextResponse } from 'next/server'
import { getKeyPair } from '@/lib/keys'

export async function GET() {
  const { publicJwk } = await getKeyPair()

  return NextResponse.json({
    keys: [publicJwk],
  })
}
