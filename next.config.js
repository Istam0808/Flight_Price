/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'b2b.prestigevoyage.uz',
      },
    ],
  },
};

module.exports = nextConfig;
