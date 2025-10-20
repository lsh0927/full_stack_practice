import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),

  // 성능 최적화 설정
  reactStrictMode: true,
  // swcMinify는 Next.js 15에서 기본값이므로 제거

  // 이미지 최적화
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },

  // 실험적 기능 제거하여 안정성 향상
  // experimental: {
  //   optimizeCss: true,
  //   optimizePackageImports: ['@heroicons/react'],
  // },

  // 컴파일러 설정
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
