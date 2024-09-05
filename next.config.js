/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/expenses?date-range=year-to-date",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
