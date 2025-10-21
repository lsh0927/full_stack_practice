'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api';
import { ChatRoom, Message } from '@/types/chat';
import { getProfileImageUrl, formatDate } from '@/lib/utils';
import { connectSocket, getSocket } from '@/lib/socket';

export default function ChatsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // 채팅방 목록 및 읽지 않은 메시지 카운트 가져오기
  const fetchChatRooms = async () => {
    try {
      setIsLoading(true);
      const [rooms, unreadCountsByRoom, unreadCountResponse] = await Promise.all([
        chatApi.getChatRooms(),
        chatApi.getUnreadCountByRoom(),
        chatApi.getUnreadCount(),
      ]);
      setChatRooms(rooms);
      setUnreadCounts(unreadCountsByRoom);
      setTotalUnreadCount(unreadCountResponse.count);
    } catch (err) {
      const message = err instanceof Error ? err.message : '채팅방 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchChatRooms();
  }, [isAuthenticated]);

  // Socket.IO 연결 및 실시간 업데이트
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Socket 연결
    const socket = connectSocket(token);

    // 새 메시지 알림 수신 - 채팅방 목록 업데이트
    socket.on('message:notification', (data: { roomId: string; senderId: string; content: string }) => {
      // 채팅방 목록 새로고침
      fetchChatRooms();
    });

    // 메시지 수신 - 마지막 메시지 업데이트
    socket.on('message:receive', (message: Message) => {
      setChatRooms((prev) =>
        prev.map((room) => {
          if (room.id === message.roomId) {
            return {
              ...room,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                senderId: message.senderId,
              },
              updatedAt: message.createdAt,
            };
          }
          return room;
        }).sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );

      // 상대방의 메시지인 경우 읽지 않은 카운트 증가
      if (message.senderId !== user?.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [message.roomId]: (prev[message.roomId] || 0) + 1,
        }));
      }
    });

    // 읽음 처리 확인 - 읽지 않은 메시지 카운트 업데이트
    socket.on('message:readConfirm', (data: { roomId: string; userId: string; messageId?: string }) => {
      if (data.userId !== user?.id) {
        // 사용자가 보낸 메시지를 상대방이 읽었을 때
        // 읽지 않은 카운트 새로고침
        fetchChatRooms();
      }
    });

    // cleanup
    return () => {
      socket.off('message:notification');
      socket.off('message:receive');
      socket.off('message:readConfirm');
    };
  }, [isAuthenticated, user?.id]);

  const handleChatRoomClick = (roomId: string) => {
    router.push(`/chats/${roomId}`);
  };

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find((p) => p.id !== user?.id);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 인스타그램 스타일 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={() => router.push('/')}
              className="text-gray-800 hover:text-gray-600 transition-colors p-2"
              title="뒤로"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 제목 */}
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold text-gray-900">채팅</h1>
              {totalUnreadCount > 0 && (
                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </div>

            {/* 홈 버튼 */}
            <button
              onClick={() => router.push('/')}
              className="text-gray-800 hover:text-gray-600 transition-colors p-2"
              title="홈으로"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full p-6">

      {chatRooms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>아직 채팅방이 없습니다.</p>
          <p className="mt-2">사용자 프로필에서 채팅을 시작해보세요!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chatRooms.map((room) => {
            const otherUser = getOtherParticipant(room);
            return (
              <div
                key={room.id}
                onClick={() => handleChatRoomClick(room.id)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* 프로필 이미지 */}
                  <div className="flex-shrink-0">
                    {getProfileImageUrl(otherUser?.profileImage) ? (
                      <img
                        src={getProfileImageUrl(otherUser?.profileImage)}
                        alt={otherUser?.username || ''}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-xl">
                          {otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 채팅방 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {otherUser?.username || '알 수 없는 사용자'}
                    </h3>
                    {room.lastMessage ? (
                      <p className="text-sm text-gray-900 font-semibold truncate">
                        {room.lastMessage.senderId === user?.id ? '나: ' : ''}
                        {room.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 font-medium italic">메시지 없음</p>
                    )}
                  </div>

                  {/* 시간 및 읽지 않은 메시지 수 */}
                  <div className="flex-shrink-0 flex flex-col items-end space-y-1">
                    <div className="text-sm text-gray-500 font-medium">
                      {room.lastMessage
                        ? formatDate(room.lastMessage.createdAt)
                        : formatDate(room.updatedAt)}
                    </div>
                    {unreadCounts[room.id] > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full px-2.5 py-1 min-w-[24px] text-center">
                        {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
