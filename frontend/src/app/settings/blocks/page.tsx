'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface BlockedUser {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  blockedAt: string;
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlockedUsers() {
      if (!token) {
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/blocks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('차단 목록을 불러오는데 실패했습니다');
        }

        const data = await response.json();
        // 백엔드가 { blocks: [...] } 형태로 반환
        const mappedUsers = data.blocks.map((block: any) => ({
          id: block.blocked.id,
          username: block.blocked.username,
          email: block.blocked.email,
          profileImage: block.blocked.profileImage,
          blockedAt: block.createdAt,
        }));
        setBlockedUsers(mappedUsers);
        setLoading(false);
      } catch (err) {
        setError('차단 목록을 불러오는 중 오류가 발생했습니다');
        setLoading(false);
      }
    }

    fetchBlockedUsers();
  }, [token, router]);

  const handleUnblock = async (userId: string, username: string) => {
    if (!token) return;

    const confirmed = window.confirm(
      `${username}님을 차단 해제하시겠습니까?\n\n차단 해제하면 이 사용자의 게시글과 댓글을 다시 볼 수 있습니다.`
    );

    if (!confirmed) return;

    setUnblockingUserId(userId);

    try {
      const response = await fetch(`${API_URL}/blocks/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '차단 해제에 실패했습니다');
      }

      // Remove from local state
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('차단이 해제되었습니다.');
    } catch (err: any) {
      alert(err.message || '차단 해제 중 오류가 발생했습니다');
    } finally {
      setUnblockingUserId(null);
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">차단한 사용자</h1>
          <p className="text-gray-600 mt-2">
            차단한 사용자의 게시글과 댓글이 숨겨집니다.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {blockedUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">차단한 사용자가 없습니다.</p>
            <Link
              href="/posts"
              className="inline-block text-purple-600 hover:underline"
            >
              게시글 보러 가기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {blockedUsers.map((blockedUser) => (
                <li
                  key={blockedUser.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Profile Image */}
                      <Link href={`/profile/${blockedUser.id}`}>
                        {blockedUser.profileImage ? (
                          <img
                            src={`${API_URL}${blockedUser.profileImage}`}
                            alt={blockedUser.username}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {blockedUser.username[0].toUpperCase()}
                          </div>
                        )}
                      </Link>

                      {/* User Info */}
                      <div>
                        <Link
                          href={`/profile/${blockedUser.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          {blockedUser.username}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {blockedUser.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          차단일: {new Date(blockedUser.blockedAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    {/* Unblock Button */}
                    <button
                      onClick={() =>
                        handleUnblock(blockedUser.id, blockedUser.username)
                      }
                      disabled={unblockingUserId === blockedUser.id}
                      className="px-6 py-2 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {unblockingUserId === blockedUser.id
                        ? '해제 중...'
                        : '차단 해제'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
