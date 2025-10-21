'use client';

import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { connectSocket, getSocket } from '@/lib/socket';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  // 읽지 않은 메시지 수 가져오기
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await chatApi.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();

      // Socket 연결하여 실시간 업데이트 받기
      const token = localStorage.getItem('token');
      if (token) {
        const socket = connectSocket(token);

        // 새 메시지 알림 수신
        socket.on('message:notification', () => {
          fetchUnreadCount(); // 새 메시지가 오면 카운트 업데이트
        });

        // 메시지 읽음 확인 수신
        socket.on('message:readConfirm', () => {
          fetchUnreadCount(); // 메시지를 읽으면 카운트 업데이트
        });

        return () => {
          socket.off('message:notification');
          socket.off('message:readConfirm');
        };
      }
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Board Project
            </Link>
          </div>

          {/* 네비게이션 */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/posts"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  게시글
                </Link>

                {/* 채팅 버튼 with 알림 뱃지 */}
                <Link
                  href="/chats"
                  className="relative text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  채팅
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 bg-red-500 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                {user && (
                  <Link
                    href={`/profile/${user.id}`}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    프로필
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}