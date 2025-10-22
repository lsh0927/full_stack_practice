'use client';

import { useState } from 'react';
import { API_URL } from '@/lib/api';

interface ProfileImageProps {
  profileImage?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ProfileImage 컴포넌트
 *
 * 프로필 이미지를 표시하며, 이미지가 없거나 로드에 실패할 경우 기본 프로필을 표시합니다.
 * 카카오 유저 등 외부 로그인 사용자의 경우 프로필 이미지가 없을 수 있습니다.
 */
export default function ProfileImage({
  profileImage,
  username,
  size = 'md',
  className = '',
}: ProfileImageProps) {
  const [imageError, setImageError] = useState(false);

  // 크기별 클래스
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  const sizeClass = sizeClasses[size];

  // 이미지가 없거나 로드 실패한 경우 기본 프로필 표시
  if (!profileImage || imageError) {
    return (
      <div
        className={`${sizeClass} bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-gray-100 dark:ring-gray-700 ${className}`}
      >
        {username?.[0]?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <img
      src={`${API_URL}${profileImage}`}
      alt={username || 'User'}
      className={`${sizeClass} rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 ${className}`}
      onError={() => setImageError(true)}
    />
  );
}
