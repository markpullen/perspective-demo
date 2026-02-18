# Prompt for Claude Code

Copy everything below the line and paste it into Claude Code in this VSCode window:

---

Read PROJECT-BRIEF.md, OIDC-SPEC.md, and TEST-USERS.md in the project root. These are your complete specifications.

Build a Next.js 14 (App Router, TypeScript) application called "Perspective Demo" that acts as an OIDC Identity Provider for testing SSO with the TradeStart Rewards portal.

The app has two concerns:
1. A user-facing portal (login, dashboard with profile + "Go to TradeStart" button)
2. OIDC Identity Provider endpoints (/.well-known/openid-configuration, /.well-known/keys, /authorize, /token, /logout)

Key requirements:
- Use `jose` library for RSA JWT signing and JWKS
- Use `bcrypt` for password hashing
- Create a `scripts/generate-keys.ts` script that generates an RSA-2048 key pair and outputs JWK JSON for env vars
- Pre-configure the 4 test users from TEST-USERS.md (hardcoded in a lib/users.ts file, passwords hashed with bcrypt)
- In-memory auth code storage (Map with 60-second TTL)
- Cookie-based sessions (httpOnly `perspective_session` cookie, 24h, signed JWT using HS256 with SESSION_SECRET)
- PKCE (S256) validation on /token exchange
- The `userprofiles` claim in the ID token must be a JSON.stringify'd string, not a raw object
- The `aud` claim must use the client_id in LOWERCASE: 3668f1e1-677d-414f-95ed-1cc789a92a85
- Tailwind CSS for styling, matching the design notes in PROJECT-BRIEF.md
- Deploy-ready for Vercel
- For local dev: auto-generate RSA keys if env vars are not set

IMPORTANT: The OIDC endpoints must be accessible at their standard paths:
- /.well-known/openid-configuration
- /.well-known/keys
- /authorize
- /token
- /logout
- /idp/resetpassword

Use Next.js route handlers and/or rewrites to achieve this.

After building, create a .env.local with these placeholder values:
```
APP_URL=http://localhost:3001
TRADESTART_CALLBACK_URL=https://staging.novusloyalty.com/api/auth/sso/callback
TRADESTART_LOGOUT_URL=https://staging.novusloyalty.com/portal/login?code=tradestart
TRADESTART_PORTAL_URL=https://staging.novusloyalty.com/portal/login?code=tradestart
SESSION_SECRET=perspective-demo-dev-secret-change-in-production-minimum-32-chars
```

Run on port 3001 (to avoid conflict with other dev servers).

Run a build to verify it compiles cleanly.
