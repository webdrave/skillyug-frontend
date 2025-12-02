/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    output: 'standalone',
  
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    },
    images: {
      domains: ['localhost', 'skillyug-2-0-backend.onrender.com', 'asset.cloudinary.com', 'images.unsplash.com', 'via.placeholder.com'],
    },
    async rewrites() {
      return [
        {
          source: '/api/auth/:path*',
          destination: '/api/auth/:path*', // Keep NextAuth routes on frontend
        },
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://backend:5000'}/api/:path*`,
        },
      ];
    },
  };
  
  module.exports = nextConfig;