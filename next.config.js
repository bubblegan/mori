/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async redirects() {
    return [
      // Basic redirect
      {
        source: "/",
        destination: "/expenses?dateRange=YearToDate",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
