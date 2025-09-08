/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['yrpcgkrichksljfrtmvs.supabase.co'],
    unoptimized: false,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig