'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi, usersApi, API_URL } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import BlockConfirmModal from '@/components/BlockConfirmModal';
import ScrollAnimation from '@/components/ScrollAnimation';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  bio?: string;
  createdAt: string;
  postCount: number;
  isOwnProfile: boolean;
  isBlocked: boolean;
}

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const data = await usersApi.getUser(id as string);
        setProfile(data);
        setLoading(false);
      } catch (err) {
        setError('프로필을 불러오는 중 오류가 발생했습니다');
        setLoading(false);
      }
    }

    if (id) {
      fetchProfile();
    }
  }, [id, token, router]);

  const handleStartChat = async () => {
    if (!id || typeof id !== 'string') return;

    setIsStartingChat(true);

    try {
      const chatRoom = await chatApi.requestChat(id);
      // 채팅방으로 이동
      router.push(`/chats/${chatRoom.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '채팅 시작에 실패했습니다';
      alert(message);
      setIsStartingChat(false);
    }
  };

  const handleBlockUser = async () => {
    if (!token || !id) return;

    setIsBlocking(true);

    try {
      const response = await fetch(`${API_URL}/blocks/${id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '차단에 실패했습니다');
      }

      // 성공 메시지 표시
      alert('사용자를 차단했습니다.');
      setShowBlockModal(false);
      router.push('/posts'); // 게시글 목록으로 이동
    } catch (err) {
      const message = err instanceof Error ? err.message : '차단 중 오류가 발생했습니다';
      alert(message);
      setIsBlocking(false);
      setShowBlockModal(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!token || !id || typeof id !== 'string') return;

    const confirmed = window.confirm(
      `${profile?.username}님을 차단 해제하시겠습니까?\n\n차단 해제하면 이 사용자의 게시글과 댓글을 다시 볼 수 있습니다.`
    );

    if (!confirmed) return;

    setIsBlocking(true);

    try {
      const response = await fetch(`${API_URL}/blocks/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '차단 해제에 실패했습니다');
      }

      alert('차단이 해제되었습니다.');
      // 프로필 정보 다시 불러오기
      router.refresh();
      window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : '차단 해제 중 오류가 발생했습니다';
      alert(message);
    } finally {
      setIsBlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || '프로필을 찾을 수 없습니다'}</p>
            <Link href="/posts" className="text-purple-600 dark:text-purple-400 hover:underline">
              게시글 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <ScrollAnimation animation="scaleIn" delay={0.1}>
          <div className="rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8 bg-white dark:bg-gray-800 transition-colors duration-200">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
              <div className="flex items-end gap-4">
                {/* Profile Image */}
                {profile.profileImage ? (
                  <img
                    src={`${API_URL}${profile.profileImage}`}
                    alt={profile.username}
                    className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-700 object-cover shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 rounded-full border-4 border-white dark:border-gray-700 flex items-center justify-center text-white font-bold text-4xl shadow-lg"
                  style={{ display: profile.profileImage ? 'none' : 'flex' }}
                >
                  {profile.username[0].toUpperCase()}
                </div>

                <div className="mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.username}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
                </div>
              </div>

              {/* Edit Button */}
              {profile.isOwnProfile && (
                <Link
                  href="/profile/edit"
                  className="mt-4 sm:mt-0 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all text-center"
                >
                  프로필 수정
                </Link>
              )}

              {/* Chat and Block Buttons */}
              {!profile.isOwnProfile && (
                <div className="mt-4 sm:mt-0 flex gap-2">
                  <button
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingChat ? '채팅 시작 중...' : '채팅하기'}
                  </button>
                  {profile.isBlocked ? (
                    <button
                      onClick={handleUnblockUser}
                      disabled={isBlocking}
                      className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBlocking ? '해제 중...' : '차단 해제'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      disabled={isBlocking}
                      className="px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-full font-semibold hover:bg-red-700 dark:hover:bg-red-800 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBlocking ? '차단 중...' : '사용자 차단'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-8 py-4 border-y border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.postCount}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">게시글</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatDate(profile.createdAt)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">가입일</p>
              </div>
            </div>
          </div>
        </div>
        </ScrollAnimation>

        {/* User's Posts */}
        <ScrollAnimation animation="slideUp" delay={0.3}>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {profile.isOwnProfile ? '내 게시글' : `${profile.username}님의 게시글`}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
            <p>게시글 목록 기능은 추후 구현 예정입니다.</p>
            <Link
              href="/posts"
              className="inline-block mt-4 text-purple-600 dark:text-purple-400 hover:underline"
            >
              전체 게시글 보기
            </Link>
          </div>
          </div>
        </ScrollAnimation>
      </div>

      {/* 차단 확인 모달 */}
      <BlockConfirmModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockUser}
        username={profile.username}
        isLoading={isBlocking}
      />
    </div>
  );
}
