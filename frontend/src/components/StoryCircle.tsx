'use client';

import { motion } from 'framer-motion';
import Avatar from './ui/Avatar';

interface StoryCircleProps {
  authorId: string;
  username: string;
  profileImage: string | null;
  hasViewed: boolean;
  isCurrentUser: boolean;
  onClick: () => void;
  onAddStory?: () => void; // 스토리 추가 버튼 클릭 핸들러 (본인만)
  hasStories?: boolean; // 스토리 존재 여부
}

/**
 * 스토리 원형 썸네일 컴포넌트
 * 인스타그램 스타일의 그라디언트 링을 가진 프로필 사진
 */
export default function StoryCircle({
  authorId,
  username,
  profileImage,
  hasViewed,
  isCurrentUser,
  onClick,
  onAddStory,
  hasStories = false,
}: StoryCircleProps) {
  const handleCircleClick = (e: React.MouseEvent) => {
    // + 버튼이 아닌 영역 클릭 시에만 스토리 조회
    if (hasStories) {
      onClick();
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    if (onAddStory) {
      onAddStory();
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center space-y-1"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      {/* 그라디언트 링 */}
      <div className="relative">
        <motion.div
          className={`
            relative p-[2px] rounded-full cursor-pointer
            ${
              hasStories && !hasViewed && !isCurrentUser
                ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                : isCurrentUser && hasStories
                ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'
                : 'bg-gray-300 dark:bg-gray-600'
            }
          `}
          onClick={handleCircleClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* 흰색 안쪽 테두리 */}
          <div className="bg-white dark:bg-gray-900 p-[3px] rounded-full">
            <Avatar
              src={profileImage || undefined}
              alt={username}
              fallbackText={username}
              size="lg"
              className="ring-0"
            />
          </div>
        </motion.div>

        {/* + 버튼 (본인 스토리만) */}
        {isCurrentUser && onAddStory && (
          <motion.button
            onClick={handleAddClick}
            className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </motion.button>
        )}
      </div>

      {/* 사용자 이름 */}
      <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[70px] truncate">
        {isCurrentUser ? '내 스토리' : username}
      </span>
    </motion.div>
  );
}
