import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/atlas': ['bin/msdf/**'],
  },
}

export default nextConfig
