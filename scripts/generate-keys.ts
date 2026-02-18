import { generateKeyPair, exportJWK } from 'jose'

async function main() {
  console.log('Generating RSA-2048 key pair...\n')

  const { privateKey, publicKey } = await generateKeyPair('RS256', { modulusLength: 2048 })

  const privateJwk = await exportJWK(privateKey)
  const publicJwk = {
    ...(await exportJWK(publicKey)),
    kid: 'perspective-demo-key-1',
    use: 'sig',
    alg: 'RS256',
  }

  console.log('=== RSA_PRIVATE_KEY_JWK ===')
  console.log(JSON.stringify(privateJwk))
  console.log()
  console.log('=== RSA_PUBLIC_KEY_JWK ===')
  console.log(JSON.stringify(publicJwk))
  console.log()
  console.log('Copy the values above into your Vercel environment variables.')
}

main().catch(console.error)
