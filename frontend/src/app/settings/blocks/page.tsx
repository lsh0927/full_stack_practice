'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { blocksApi, API_URL } from '@/lib/api';

interface BlockedUser {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  blockedAt: string;
}

interface BlockedUserData {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
}

interface Block {
  blocked: BlockedUserData;
  createdAt: string;
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
        const data = await blocksApi.getBlocks();
        // 백엔드가 { blocks: [...] } 형태로 반환
        const mappedUsers = data.blocks.map((block: Block) => ({
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
      await blocksApi.unblockUser(userId);
      // Remove from local state
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      alert('차단이 해제되었습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '차단 해제 중 오류가 발생했습니다';
      alert(message);
    } finally {
      setUnblockingUserId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">차단한 사용자</h1>
          <p className="text-gray-600 mt-2">
            차단한 사용자의 게시글, 댓글, 채팅이 숨겨집니다.
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
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl"
                          style={{ display: blockedUser.profileImage ? 'none' : 'flex' }}
                        >
                          {blockedUser.username[0].toUpperCase()}
                        </div>
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
      </>
      )}
    </div>
  );
}
