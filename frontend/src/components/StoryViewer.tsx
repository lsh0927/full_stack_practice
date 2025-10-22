'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story } from '@/types/story';
import { storiesApi, API_URL } from '@/lib/api';
import Avatar from './ui/Avatar';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface StoryViewerProps {
  stories: Story[];
  author: {
    id: string;
    username: string;
    profileImage: string | null;
  };
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onStoryViewed?: (storyId: string) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 풀스크린 스토리 뷰어 컴포넌트
 * 인스타그램 스타일의 스토리 보기 화면
 */
export default function StoryViewer({
  stories,
  author,
  onClose,
  onNext,
  onPrev,
  onStoryViewed,
  hasNext,
  hasPrev,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5초

  // 스토리 읽음 처리
  const markAsViewed = async (storyId: string) => {
    try {
      await storiesApi.markStoryAsViewed(storyId);
      // 부모 컴포넌트에게 조회 완료 알림
      if (onStoryViewed) {
        onStoryViewed(storyId);
      }
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  // 다음 스토리로 이동
  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else if (hasNext) {
      onNext();
    } else {
      // React 렌더링 사이클 문제 방지를 위해 다음 틴에서 실행
      setTimeout(() => {
        onClose();
      }, 0);
    }
  }, [currentIndex, stories.length, hasNext, onNext, onClose]);

  // 이전 스토리로 이동
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else if (hasPrev) {
      onPrev();
    }
  }, [currentIndex, hasPrev, onPrev]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  // 자동 진행 타이머
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, goToNext]);

  // 스토리 변경 시 읽음 처리
  useEffect(() => {
    if (currentStory && !currentStory.isViewed) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory]);

  // Body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        // 배경 클릭 시 닫기
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 프로그레스 바 */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: '0%' }}
              animate={{
                width:
                  index < currentIndex
                    ? '100%'
                    : index === currentIndex
                    ? `${progress}%`
                    : '0%',
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
        ))}
      </div>

      {/* 헤더 */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 mt-4">
        <div className="flex items-center space-x-3">
          <Avatar
            src={author.profileImage || undefined}
            alt={author.username}
            fallbackText={author.username}
            size="sm"
          />
          <span className="text-white font-semibold text-sm drop-shadow-lg">
            {author.username}
          </span>
          <span className="text-white/70 text-xs">
            {new Date(currentStory.createdAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* 스토리 콘텐츠 */}
      <div className="relative w-full h-full max-w-lg mx-auto flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            className="relative w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {currentStory.mediaType === 'image' ? (
              <img
                src={`${API_URL}${currentStory.mediaUrl}`}
                alt="Story"
                className="max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            ) : (
              <video
                src={`${API_URL}${currentStory.mediaUrl}`}
                className="max-w-full max-h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* 좌측 네비게이션 영역 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={goToPrev}
        >
          {(hasPrev || currentIndex > 0) && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
              <ChevronLeftIcon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          )}
        </div>

        {/* 우측 네비게이션 영역 */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
          onClick={goToNext}
        >
          {(hasNext || currentIndex < stories.length - 1) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
              <ChevronRightIcon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      </div>

      {/* 조회수 */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-white text-sm">
            👁 {currentStory.viewsCount} views
          </span>
        </div>
      </div>
    </motion.div>
  );
}
