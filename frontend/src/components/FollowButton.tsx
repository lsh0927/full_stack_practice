'use client';

import { useState, useEffect } from 'react';
import { followsApi } from '@/lib/api';

interface FollowButtonProps {
  userId: string;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  userId,
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 팔로우 상태 조회
  useEffect(() => {
    setIsMounted(true);
    async function fetchFollowStatus() {
      try {
        const res = await followsApi.isFollowing(userId);
        setIsFollowing(res.isFollowing);
      } catch (error) {
        console.error('팔로우 상태 조회 실패:', error);
      }
    }

    fetchFollowStatus();

    // 페이지 포커스 시 재조회
    const handleFocus = () => {
      fetchFollowStatus();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]);

  // 팔로우 토글
  const handleFollowToggle = async () => {
    if (isLoading || !isMounted) return;

    setIsLoading(true);
    const previousState = isFollowing;

    // Optimistic UI 업데이트
    setIsFollowing(!isFollowing);

    try {
      const result = await followsApi.toggleFollow(userId);
      setIsFollowing(result.isFollowing);
      onFollowChange?.(result.isFollowing);
    } catch (error) {
      // 실패 시 원래 상태로 되돌리기
      setIsFollowing(previousState);
      console.error('팔로우 토글 실패:', error);
      alert('팔로우 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          : 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white hover:shadow-lg'
      } ${className}`}
    >
      {/* User Icon */}
      {isFollowing ? (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      )}

      {/* Button Text */}
      <span>{isLoading ? '처리 중...' : isFollowing ? '팔로잉' : '팔로우'}</span>
    </button>
  );
}
