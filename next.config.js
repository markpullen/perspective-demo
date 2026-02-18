/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/.well-known/openid-configuration',
        destination: '/api/oidc/discovery',
      },
      {
        source: '/.well-known/keys',
        destination: '/api/oidc/keys',
      },
    ]
  },
}

module.exports = nextConfig
