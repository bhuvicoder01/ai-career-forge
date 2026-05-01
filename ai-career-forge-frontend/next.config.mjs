/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ai-career-forge-users-data-bucket.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};
export default nextConfig;
