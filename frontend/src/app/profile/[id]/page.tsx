'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
  bio?: string;
  createdAt: string;
  postCount: number;
  isOwnProfile: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

  useEffect(() => {
    async function fetchProfile() {
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('프로필을 불러오는데 실패했습니다');
        }

        const data = await response.json();
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
    } catch (err: any) {
      alert(err.message || '채팅 시작에 실패했습니다');
      setIsStartingChat(false);
    }
  };

  const handleBlockUser = async () => {
    if (!token || !id) return;

    const confirmed = window.confirm(
      `정말로 ${profile?.username}님을 차단하시겠습니까?\n\n차단하면:\n- 이 사용자의 게시글과 댓글이 보이지 않습니다.\n- 이 사용자도 회원님의 게시글과 댓글을 볼 수 없습니다.`
    );

    if (!confirmed) return;

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

      alert('사용자를 차단했습니다.');
      router.push('/posts'); // 게시글 목록으로 이동
    } catch (err: any) {
      alert(err.message || '차단 중 오류가 발생했습니다');
      setIsBlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 mb-4">{error || '프로필을 찾을 수 없습니다'}</p>
            <Link href="/posts" className="text-purple-600 hover:underline">
              게시글 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/posts"
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            Board
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/settings/blocks"
                  className="px-4 py-2 text-gray-600 hover:text-purple-600 font-medium transition-colors"
                >
                  차단 목록
                </Link>
                <Link
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {user.profileImage ? (
                    <img
                      src={`${API_URL}${user.profileImage}`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {user.username}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-purple-600 to-pink-600"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-6">
              <div className="flex items-end gap-4">
                {/* Profile Image */}
                {profile.profileImage ? (
                  <img
                    src={`${API_URL}${profile.profileImage}`}
                    alt={profile.username}
                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full border-4 border-white flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}

                <div className="mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.username}
                  </h1>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>

              {/* Edit Button */}
              {profile.isOwnProfile && (
                <Link
                  href="/profile/edit"
                  className="mt-4 sm:mt-0 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition-all text-center"
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
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStartingChat ? '채팅 시작 중...' : '채팅하기'}
                  </button>
                  <button
                    onClick={handleBlockUser}
                    disabled={isBlocking}
                    className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBlocking ? '차단 중...' : '사용자 차단'}
                  </button>
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-6">
                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-8 py-4 border-y border-gray-200">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {profile.postCount}
                </p>
                <p className="text-sm text-gray-500">게시글</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(profile.createdAt)}
                </p>
                <p className="text-sm text-gray-500">가입일</p>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {profile.isOwnProfile ? '내 게시글' : `${profile.username}님의 게시글`}
          </h2>
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p>게시글 목록 기능은 추후 구현 예정입니다.</p>
            <Link
              href="/posts"
              className="inline-block mt-4 text-purple-600 hover:underline"
            >
              전체 게시글 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
