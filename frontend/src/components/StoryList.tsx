'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Story } from '@/types/story';
import { storiesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import StoryCircle from './StoryCircle';
import StoryViewer from './StoryViewer';
import StoryUploadModal from './StoryUploadModal';

interface GroupedStories {
  authorId: string;
  author: {
    id: string;
    username: string;
    profileImage: string | null;
  };
  stories: Story[];
  hasViewed: boolean;
  isCurrentUser: boolean;
}

/**
 * 스토리 리스트 컴포넌트
 * 가로 스크롤 가능한 스토리 썸네일 목록
 */
export default function StoryList() {
  const { user } = useAuth();
  const [groupedStories, setGroupedStories] = useState<GroupedStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuthorIndex, setSelectedAuthorIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // 스토리 데이터 가져오기
  const fetchStories = async () => {
    try {
      setLoading(true);
      const data = await storiesApi.getFollowingStories();

      // 작성자별로 그룹화 (백엔드에서 이미 그룹화되어 올 수도 있음)
      const grouped: { [key: string]: GroupedStories } = {};

      // 현재 사용자 스토리 추가
      if (user) {
        const userStories = await storiesApi.getUserStories(user.id);
        if (userStories && userStories.length > 0) {
          grouped[user.id] = {
            authorId: user.id,
            author: {
              id: user.id,
              username: user.username,
              profileImage: user.profileImage || null,
            },
            stories: userStories,
            hasViewed: userStories.every((s: Story) => s.isViewed),
            isCurrentUser: true,
          };
        }
      }

      // 팔로잉 스토리 추가
      if (data && Array.isArray(data)) {
        data.forEach((story: Story) => {
          const authorId = story.authorId;

          if (!grouped[authorId]) {
            grouped[authorId] = {
              authorId,
              author: story.author,
              stories: [],
              hasViewed: true,
              isCurrentUser: authorId === user?.id,
            };
          }

          grouped[authorId].stories.push(story);

          // 하나라도 안 본 스토리가 있으면 hasViewed = false
          if (!story.isViewed) {
            grouped[authorId].hasViewed = false;
          }
        });
      }

      // 배열로 변환 및 정렬 (현재 사용자 스토리는 항상 맨 앞)
      const groupedArray = Object.values(grouped).sort((a, b) => {
        if (a.isCurrentUser) return -1;
        if (b.isCurrentUser) return 1;
        // 안 본 스토리를 앞으로
        if (!a.hasViewed && b.hasViewed) return -1;
        if (a.hasViewed && !b.hasViewed) return 1;
        return 0;
      });

      setGroupedStories(groupedArray);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  // 키보드 방향키로 스크롤
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHovered || !scrollContainerRef.current) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          left: -200,
          behavior: 'smooth',
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollContainerRef.current.scrollBy({
          left: 200,
          behavior: 'smooth',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHovered]);

  const handleStoryClick = (index: number) => {
    setSelectedAuthorIndex(index);
  };

  const handleCloseViewer = () => {
    setSelectedAuthorIndex(null);
    // 스토리 뷰어를 닫을 때 데이터 새로고침
    fetchStories();
  };

  const handleNextAuthor = () => {
    if (selectedAuthorIndex === null) return;
    const nextIndex = selectedAuthorIndex + 1;
    if (nextIndex < groupedStories.length) {
      setSelectedAuthorIndex(nextIndex);
    } else {
      handleCloseViewer();
    }
  };

  const handlePrevAuthor = () => {
    if (selectedAuthorIndex === null) return;
    const prevIndex = selectedAuthorIndex - 1;
    if (prevIndex >= 0) {
      setSelectedAuthorIndex(prevIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4 px-4 py-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center space-y-1 animate-pulse">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="w-12 h-3 bg-gray-300 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  // 조회한 스토리는 현재 사용자가 아니면 화면에서 숨김
  const visibleStories = groupedStories.filter(
    (group) => group.isCurrentUser || !group.hasViewed
  );

  // 현재 사용자 스토리와 나머지 스토리 분리
  const myStory = visibleStories.find((group) => group.isCurrentUser);
  const otherStories = visibleStories.filter((group) => !group.isCurrentUser);

  // 스토리 추가 핸들러
  const handleAddStory = () => {
    setShowUploadModal(true);
  };

  // 스토리 업로드 성공 시
  const handleUploadSuccess = () => {
    // 스토리 목록 새로고침
    fetchStories();
  };

  return (
    <>
      <motion.div
        className="flex items-center py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 본인 프로필 - 좌측 고정 (항상 표시) */}
        {user && (
          <div className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900 pl-4 pr-2">
            <StoryCircle
              key={user.id}
              authorId={user.id}
              username={user.username}
              profileImage={user.profileImage || null}
              hasViewed={myStory?.hasViewed || false}
              isCurrentUser={true}
              hasStories={myStory ? myStory.stories.length > 0 : false}
              onClick={() => {
                if (myStory) {
                  handleStoryClick(groupedStories.indexOf(myStory));
                }
              }}
              onAddStory={handleAddStory}
            />
          </div>
        )}

        {/* 팔로잉 스토리 - 스크롤 가능 */}
        <div
          ref={scrollContainerRef}
          className="flex items-center space-x-4 px-2 overflow-x-auto scrollbar-hide flex-1"
        >
          {otherStories.map((group) => (
            <StoryCircle
              key={group.authorId}
              authorId={group.authorId}
              username={group.author.username}
              profileImage={group.author.profileImage}
              hasViewed={group.hasViewed}
              isCurrentUser={group.isCurrentUser}
              hasStories={group.stories.length > 0}
              onClick={() => handleStoryClick(groupedStories.indexOf(group))}
            />
          ))}
        </div>
      </motion.div>

      {/* 스토리 뷰어 */}
      {selectedAuthorIndex !== null && (
        <StoryViewer
          stories={groupedStories[selectedAuthorIndex].stories}
          author={groupedStories[selectedAuthorIndex].author}
          onClose={handleCloseViewer}
          onNext={handleNextAuthor}
          onPrev={handlePrevAuthor}
          hasPrev={selectedAuthorIndex > 0}
          hasNext={selectedAuthorIndex < groupedStories.length - 1}
        />
      )}

      {/* 스토리 업로드 모달 */}
      <StoryUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
