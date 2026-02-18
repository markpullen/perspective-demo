import { NextResponse } from 'next/server'

export async function GET() {
  const appUrl = process.env.APP_URL || 'http://localhost:3001'

  return NextResponse.json({
    issuer: appUrl,
    authorization_endpoint: `${appUrl}/authorize`,
    token_endpoint: `${appUrl}/token`,
    jwks_uri: `${appUrl}/.well-known/keys`,
    end_session_endpoint: `${appUrl}/logout`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
  })
}
