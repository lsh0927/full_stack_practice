'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api';
import { ChatRoom } from '@/types/chat';
import { getProfileImageUrl, formatDate } from '@/lib/utils';

export default function ChatsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchChatRooms = async () => {
      try {
        setIsLoading(true);
        const [rooms, unreadCountsByRoom] = await Promise.all([
          chatApi.getChatRooms(),
          chatApi.getUnreadCountByRoom(),
        ]);
        setChatRooms(rooms);
        setUnreadCounts(unreadCountsByRoom);
      } catch (err: any) {
        setError(err.message || '채팅방 목록을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatRooms();
  }, [isAuthenticated]);

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">채팅 목록</h1>

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
                      <p className="text-sm text-gray-600 font-medium truncate">
                        {room.lastMessage.senderId === user?.id ? '나: ' : ''}
                        {room.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">메시지 없음</p>
                    )}
                  </div>

                  {/* 시간 및 읽지 않은 메시지 수 */}
                  <div className="flex-shrink-0 flex flex-col items-end space-y-1">
                    <div className="text-sm text-gray-400">
                      {room.lastMessage
                        ? formatDate(room.lastMessage.createdAt)
                        : formatDate(room.updatedAt)}
                    </div>
                    {unreadCounts[room.id] > 0 && (
                      <div className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center">
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
  );
}
