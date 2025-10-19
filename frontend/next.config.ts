import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),

  // 성능 최적화 설정
  reactStrictMode: true,
  swcMinify: true, // SWC 컴파일러 사용으로 빠른 빌드

  // 이미지 최적화
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },

  // 실험적 기능으로 성능 개선
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react'],
  },

  // 웹팩 설정 최적화
  webpack: (config, { dev, isServer }) => {
    // 개발 모드에서 소스맵 최적화
    if (dev && !isServer) {
      config.devtool = 'cheap-module-source-map';
    }

    // 모듈 리졸빙 최적화
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'src'),
    };

    return config;
  },

  // 컴파일러 설정
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
