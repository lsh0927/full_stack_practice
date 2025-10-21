'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getProfileImageUrl } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallbackText?: string;
  size?: AvatarSize;
  className?: string;
  onClick?: () => void;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs' },
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-12 h-12', text: 'text-lg' },
  xl: { container: 'w-16 h-16', text: 'text-xl' },
  '2xl': { container: 'w-24 h-24', text: 'text-3xl' },
};

/**
 * 아바타 컴포넌트
 * 프로필 이미지를 표시하고, 이미지가 없거나 로드 실패 시 fallback 표시
 */
export default function Avatar({
  src,
  alt = 'User avatar',
  fallbackText,
  size = 'md',
  className = '',
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = src ? getProfileImageUrl(src) : undefined;

  // Fallback 텍스트 (이름의 첫 글자 또는 '?')
  const getFallbackText = () => {
    if (fallbackText) {
      return fallbackText.charAt(0).toUpperCase();
    }
    if (alt && alt !== 'User avatar') {
      return alt.charAt(0).toUpperCase();
    }
    return '?';
  };

  const showImage = imageUrl && !imageError;
  const { container, text } = sizeClasses[size];

  return (
    <motion.div
      className={`
        relative inline-flex items-center justify-center
        rounded-full overflow-hidden
        ${container}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      whileHover={
        onClick
          ? {
              scale: 1.1,
              rotate: [0, -5, 5, -5, 0],
              transition: {
                scale: { type: 'spring', stiffness: 300, damping: 15 },
                rotate: { duration: 0.5 },
              },
            }
          : undefined
      }
      whileTap={
        onClick
          ? {
              scale: 0.9,
              transition: { type: 'spring', stiffness: 400, damping: 17 },
            }
          : undefined
      }
    >
      {showImage ? (
        <motion.img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      ) : (
        <motion.div
          className={`
            w-full h-full
            flex items-center justify-center
            bg-gradient-to-br from-purple-400 to-pink-400
            text-white font-bold
            ${text}
          `}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {getFallbackText()}
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * 아바타 그룹 컴포넌트
 * 여러 아바타를 겹쳐서 표시 (참가자 목록 등)
 */
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    alt?: string;
    fallbackText?: string;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({ avatars, max = 3, size = 'md', className = '' }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={`flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className="-ml-2 first:ml-0 ring-2 ring-white rounded-full"
          style={{ zIndex: displayAvatars.length - index }}
        >
          <Avatar
            src={avatar.src}
            alt={avatar.alt}
            fallbackText={avatar.fallbackText}
            size={size}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`
            -ml-2 ring-2 ring-white rounded-full
            flex items-center justify-center
            bg-gray-200 text-gray-600 font-semibold
            ${sizeClasses[size].container}
            ${sizeClasses[size].text}
          `}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
