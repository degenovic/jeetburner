/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Alias bigint-buffer to @trufflesuite/bigint-buffer for security
    config.resolve.alias['bigint-buffer'] = '@trufflesuite/bigint-buffer';
    return config;
  },
}

module.exports = nextConfig
