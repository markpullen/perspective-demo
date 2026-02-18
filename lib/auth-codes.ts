interface AuthCodeData {
  codeChallenge: string
  redirectUri: string
  clientId: string
  nonce: string
  userId: string
  createdAt: number
}

const authCodes = new Map<string, AuthCodeData>()

function cleanExpired() {
  const now = Date.now()
  for (const [code, data] of authCodes.entries()) {
    if (now - data.createdAt > 60_000) {
      authCodes.delete(code)
    }
  }
}

export function storeAuthCode(code: string, data: Omit<AuthCodeData, 'createdAt'>) {
  authCodes.set(code, { ...data, createdAt: Date.now() })
}

export function consumeAuthCode(code: string): AuthCodeData | null {
  cleanExpired()
  const data = authCodes.get(code)
  if (!data) return null
  if (Date.now() - data.createdAt > 60_000) {
    authCodes.delete(code)
    return null
  }
  authCodes.delete(code)
  return data
}
