# Perspective Demo — OIDC Identity Provider Specification

## Overview

This app simulates the PSTPF Identity Provider used by Eden Brae Homes' supply chain.
It implements a minimal but spec-compliant OIDC Authorization Code + PKCE flow.

The purpose is to test SSO integration with the TradeStart Rewards portal (hosted on Novus Loyalty platform).

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/.well-known/openid-configuration` | GET | OIDC Discovery document |
| `/.well-known/keys` | GET | JWKS — RSA public key for JWT verification |
| `/authorize` | GET | Authorization endpoint — shows login or auto-redirects if session exists |
| `/token` | POST | Token exchange — returns signed ID token |
| `/logout` | GET | Logout — destroys session, redirects to post_logout_redirect_uri |
| `/idp/resetpassword` | GET | Password reset placeholder page |

## Registered Service Provider (TradeStart on Novus)

| Setting | Value |
|---------|-------|
| client_id | `3668F1E1-677D-414F-95ED-1CC789A92A85` |
| redirect_uri | Set via `TRADESTART_CALLBACK_URL` env var |
| post_logout_redirect_uri | Set via `TRADESTART_LOGOUT_URL` env var |

Only this one client is registered. Reject requests with any other `client_id`.

## Discovery Document (/.well-known/openid-configuration)

Return JSON:
```json
{
  "issuer": "{APP_URL}",
  "authorization_endpoint": "{APP_URL}/authorize",
  "token_endpoint": "{APP_URL}/token",
  "jwks_uri": "{APP_URL}/.well-known/keys",
  "end_session_endpoint": "{APP_URL}/logout",
  "response_types_supported": ["code"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["none"],
  "code_challenge_methods_supported": ["S256"]
}
```

## JWKS Endpoint (/.well-known/keys)

Return the RSA public key in JWK format:
```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "perspective-demo-key-1",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

The key is loaded from the `RSA_PUBLIC_KEY_JWK` env var (parsed as JSON).

## /authorize Request

Browser GET redirect. All parameters as query string.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `response_type` | Yes | Must be `code` |
| `client_id` | Yes | Must match `3668F1E1-677D-414F-95ED-1CC789A92A85` (case-insensitive) |
| `redirect_uri` | Yes | Must match `TRADESTART_CALLBACK_URL` env var |
| `scope` | Yes | Must include `openid` |
| `state` | Yes | CSRF token, returned unchanged. Max 1024 chars |
| `nonce` | Yes | Replay protection, included in ID token. Max 256 chars |
| `code_challenge` | Yes | SHA-256 hash of code_verifier, Base64URL-encoded. 43-128 chars |
| `code_challenge_method` | Yes | Must be `S256` |

### Behavior:

1. **Validate all parameters** — if any missing or invalid, redirect to `redirect_uri?error=invalid_request&error_description=...`
2. **Check if user is already logged in** (valid `perspective_session` cookie):
   - If YES: generate auth code, store it, redirect immediately to `redirect_uri?code=<auth_code>&state=<state>`
   - If NO: show login page with the OIDC parameters stored (in hidden fields or session). After successful login, generate auth code and redirect.
3. **Auth code generation:** Use `crypto.randomUUID()`. Store in memory Map with: `{ codeChallenge, redirectUri, clientId, nonce, userId, createdAt }`. TTL: 60 seconds.

### Error Responses:

Redirect to `redirect_uri` with error params:
- `error=invalid_request` — missing or malformed params
- `error=unauthorized_client` — wrong client_id or redirect_uri
- `error=unsupported_response_type` — response_type is not "code"
- `error=access_denied` — user denied or login failed

## /token Request

**POST**, Content-Type: `application/x-www-form-urlencoded`

| Parameter | Required | Description |
|-----------|----------|-------------|
| `grant_type` | Yes | Must be `authorization_code` |
| `code` | Yes | Authorization code from /authorize callback |
| `redirect_uri` | Yes | Must match the /authorize request |
| `client_id` | Yes | Must match registered client_id (case-insensitive) |
| `code_verifier` | Yes | Original PKCE verifier (validated against stored code_challenge) |

### Validation Steps:

1. Verify `grant_type` is `authorization_code`
2. Look up the auth code in the in-memory store
3. If not found or expired (>60 seconds): return error `invalid_grant`
4. Verify `client_id` matches stored value (case-insensitive)
5. Verify `redirect_uri` matches stored value
6. **Verify PKCE:** compute `base64url(sha256(code_verifier))` and compare to stored `code_challenge`. If mismatch: return error `invalid_code_verifier`
7. Delete the auth code from store (single-use)
8. Look up the user by stored `userId`
9. Build and sign the ID token JWT

### Success Response (200):

```json
{
  "id_token": "<RSA-signed JWT>",
  "token_type": "Bearer",
  "expires_in": 9000,
  "scope": "openid profile email"
}
```

### Error Response (400):

```json
{
  "error": "invalid_grant",
  "error_description": "The authorisation code has expired."
}
```

Other error codes: `invalid_request`, `invalid_code_verifier`, `unauthorized_client`

## ID Token (JWT)

Sign with **RS256** using the private key from `RSA_PRIVATE_KEY_JWK`.

### Header:
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "perspective-demo-key-1"
}
```

### Payload Claims:

| Claim | Value | Notes |
|-------|-------|-------|
| `iss` | `{APP_URL}` | The Perspective Demo URL |
| `aud` | `3668f1e1-677d-414f-95ed-1cc789a92a85` | client_id in **LOWERCASE** |
| `sub` | User's ContactId (UUID) | From user record |
| `unique_name` | User's email | |
| `email` | User's email | |
| `nonce` | The nonce from the /authorize request | Must match |
| `exp` | Current time + 900 seconds (15 min) | |
| `iat` | Current time | |
| `userprofiles` | **JSON string** (not object!) | `JSON.stringify(profileObject)` |

### userprofiles Claim Structure

This is the critical claim. It must be a **JSON string** (i.e., the profile object run through `JSON.stringify()` before being placed in the JWT payload). This matches the real PSTPF behavior.

```json
{
  "ContactId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ContactFullName": "John Smith",
  "FirstNames": "John",
  "Surname": "Smith",
  "EmailAddress": "john@smithbricklaying.com.au",
  "MobileNumber": "0412345678",
  "ContactPostalAddress": {
    "AddressLineOne": "45 Builder Lane",
    "AddressLineTwo": "",
    "Suburb": "Penrith",
    "Poscode": "2750",
    "FullAddress": "45 Builder Lane, Penrith 2750"
  },
  "Organisations": [
    {
      "OrganisationContactId": "e5f6a7b8-c9d0-1234-5678-9abcdef01234",
      "OrganisationFullName": "Smith Bricklaying Pty Ltd",
      "TradingName": "Smith Bricklaying",
      "ABN": "12345678901",
      "OrganisationAlternateKey": "SMIBRIC"
    }
  ]
}
```

**`OrganisationAlternateKey`** is the Vendor ID — the key that links SSO users to their transaction/invoice history in TradeStart. This is the most important field for integration.

**Note:** `Poscode` (not Postcode) is the real field name from PSTPF — preserve this typo.

## /logout Endpoint

**GET** `/logout?client_id=<id>&post_logout_redirect_uri=<url>`

1. Validate `client_id` matches registered client (case-insensitive)
2. Destroy the `perspective_session` cookie
3. If `post_logout_redirect_uri` is provided: redirect there
4. Otherwise: redirect to `/login`

## Authorization Code Storage

Auth codes must be:
- **Single-use** — delete from store after successful /token exchange
- **Short-lived** — expire after 60 seconds
- **Stored with:** code_challenge, redirect_uri, client_id, nonce, userId, createdAt

Use an in-memory `Map<string, AuthCodeData>` for storage. This is a demo — no persistence needed.

Clean up expired codes on each /token request (iterate Map, delete entries older than 60s).

## RSA Key Pair

Generate an RSA key pair (2048-bit) for signing ID tokens.

**For deployment (Vercel):**
- Store as env vars: `RSA_PRIVATE_KEY_JWK` and `RSA_PUBLIC_KEY_JWK` (JSON strings)
- Create a `scripts/generate-keys.ts` script that:
  1. Uses `jose.generateKeyPair('RS256')` to create a 2048-bit RSA key pair
  2. Exports both keys to JWK format using `jose.exportJWK()`
  3. Adds `kid: 'perspective-demo-key-1'`, `use: 'sig'`, `alg: 'RS256'` to the public key
  4. Outputs both JWK JSON strings to console for copy-paste into Vercel env vars

**For local development:**
- If env vars are not set, auto-generate a key pair on startup and log a warning
- Store in module-level variables (regenerated on each cold start — fine for dev)

## PKCE Validation

When validating the `code_verifier` against the stored `code_challenge`:

```typescript
import { createHash } from 'crypto'

function verifyPkce(codeVerifier: string, storedCodeChallenge: string): boolean {
  const expected = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')
  return expected === storedCodeChallenge
}
```

If verification fails, return error `invalid_code_verifier` with description "The code verifier does not match the code challenge."
