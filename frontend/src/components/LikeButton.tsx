'use client';

import { useState, useEffect } from 'react';
import { likesApi } from '@/lib/api';

interface LikeButtonProps {
  postId: string;
  initialLikesCount?: number;
  className?: string;
}

export default function LikeButton({
  postId,
  initialLikesCount = 0,
  className = '',
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLoading, setIsLoading] = useState(false);

  // 좋아요 상태 및 개수 조회
  useEffect(() => {
    async function fetchLikeData() {
      try {
        const [statusRes, countRes] = await Promise.all([
          likesApi.getLikeStatus(postId),
          likesApi.getLikesCount(postId),
        ]);
        setIsLiked(statusRes.isLiked);
        setLikesCount(countRes.count);
      } catch (error) {
        console.error('좋아요 데이터 조회 실패:', error);
      }
    }

    fetchLikeData();

    // 페이지 포커스 시 재조회 (다른 페이지 갔다가 돌아올 때)
    const handleFocus = () => {
      fetchLikeData();
    };

    window.addEventListener('focus', handleFocus);

    // cleanup: 이벤트 리스너 제거
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [postId]);

  // 좋아요 토글
  const handleLikeToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const previousState = isLiked;
    const previousCount = likesCount;

    // Optimistic UI 업데이트
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      if (isLiked) {
        await likesApi.unlikePost(postId);
      } else {
        await likesApi.likePost(postId);
      }
    } catch (error) {
      // 실패 시 원래 상태로 되돌리기
      setIsLiked(previousState);
      setLikesCount(previousCount);
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        isLiked
          ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${className}`}
    >
      {/* Heart Icon */}
      <svg
        className={`w-5 h-5 transition-transform ${isLiked ? 'scale-110' : 'scale-100'}`}
        fill={isLiked ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>

      {/* Likes Count */}
      <span className="font-semibold">{likesCount}</span>
    </button>
  );
}
