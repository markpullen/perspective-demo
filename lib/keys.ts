import { generateKeyPair, importJWK, exportJWK } from 'jose'
import type { KeyLike } from 'jose'

interface KeyPair {
  privateKey: KeyLike
  publicKey: KeyLike
  publicJwk: object
}

let keyPairCache: KeyPair | null = null

export async function getKeyPair(): Promise<KeyPair> {
  if (keyPairCache) return keyPairCache

  const privateJwkStr = process.env.RSA_PRIVATE_KEY_JWK
  const publicJwkStr = process.env.RSA_PUBLIC_KEY_JWK

  if (privateJwkStr && publicJwkStr) {
    const privateJwk = JSON.parse(privateJwkStr)
    const publicJwk = JSON.parse(publicJwkStr)
    const privateKey = await importJWK(privateJwk, 'RS256') as KeyLike
    const publicKey = await importJWK(publicJwk, 'RS256') as KeyLike
    keyPairCache = { privateKey, publicKey, publicJwk }
  } else {
    console.warn('[perspective-demo] RSA_PRIVATE_KEY_JWK / RSA_PUBLIC_KEY_JWK not set — auto-generating keys for local dev')
    const { privateKey, publicKey } = await generateKeyPair('RS256', { modulusLength: 2048 })
    const publicJwk = {
      ...(await exportJWK(publicKey)),
      kid: 'perspective-demo-key-1',
      use: 'sig',
      alg: 'RS256',
    }
    keyPairCache = { privateKey, publicKey, publicJwk }
  }

  return keyPairCache
}
