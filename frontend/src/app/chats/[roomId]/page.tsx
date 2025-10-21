'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api';
import { connectSocket, joinRoom, leaveRoom, sendMessage, startTyping, stopTyping, getSocket, markMessageAsRead } from '@/lib/socket';
import { ChatRoom, Message } from '@/types/chat';
import { getProfileImageUrl, formatMessageTime } from '@/lib/utils';

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 스크롤을 최하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 인증 확인
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // 채팅방 정보 및 메시지 로드
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [roomData, messagesData] = await Promise.all([
          chatApi.getChatRoom(roomId),
          chatApi.getMessages(roomId),
        ]);
        setChatRoom(roomData);
        setMessages(messagesData.messages);

        // 채팅방에 들어오면 모든 메시지를 읽음 처리
        markMessageAsRead({ roomId });
      } catch (err: any) {
        setError(err.message || '채팅방을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, roomId]);

  // Socket.IO 연결 및 이벤트 리스너
  useEffect(() => {
    if (!isAuthenticated || !token || !roomId) return;

    // Socket 연결
    const socket = connectSocket(token);

    // 채팅방 참여
    joinRoom(roomId);

    // 새 메시지 수신
    socket.on('message:receive', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();

      // 상대방의 메시지인 경우 읽음 처리
      if (message.senderId !== user?.id) {
        markMessageAsRead({ roomId, messageId: message._id });
      }
    });

    // 타이핑 상태 수신
    socket.on('typing:status', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    });

    // 에러 처리
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });

    // cleanup
    return () => {
      leaveRoom(roomId);
      socket.off('message:receive');
      socket.off('typing:status');
      socket.off('error');
    };
  }, [isAuthenticated, token, roomId, user?.id]);

  // 스크롤 자동 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatRoom || !user) return;

    const otherUser = chatRoom.participants.find((p) => p.id !== user.id);
    if (!otherUser) return;

    sendMessage({
      roomId,
      receiverId: otherUser.id,
      content: newMessage.trim(),
    });

    setNewMessage('');
    stopTyping(roomId);
  };

  // 타이핑 중 표시
  const handleTyping = () => {
    startTyping(roomId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(roomId);
    }, 1000);
  };

  const getOtherUser = () => {
    if (!chatRoom || !user) return null;
    return chatRoom.participants.find((p) => p.id !== user.id);
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

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* 뒤로가기 버튼 - 인스타그램 스타일 */}
            <button
              onClick={() => router.push('/chats')}
              className="text-gray-800 hover:text-gray-600 transition-colors"
              title="뒤로"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 사용자 정보 */}
            {otherUser && (
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => router.push(`/profile/${otherUser.id}`)}
              >
                {getProfileImageUrl(otherUser.profileImage) ? (
                  <img
                    src={getProfileImageUrl(otherUser.profileImage)}
                    alt={otherUser.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {otherUser.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-900">{otherUser.username}</h2>
                  {isTyping && <p className="text-sm text-gray-500">입력 중...</p>}
                </div>
              </div>
            )}
          </div>

          {/* 홈 버튼 - 인스타그램 스타일 */}
          <button
            onClick={() => router.push('/')}
            className="text-gray-800 hover:text-gray-600 transition-colors"
            title="홈으로"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          const messageUser = isMine ? user : otherUser;

          return (
            <div
              key={message._id}
              className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              {/* 상대방 메시지: 프로필 사진 + 메시지 */}
              {!isMine && (
                <>
                  {/* 프로필 사진 */}
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => router.push(`/profile/${otherUser?.id}`)}
                  >
                    {getProfileImageUrl(otherUser?.profileImage) ? (
                      <img
                        src={getProfileImageUrl(otherUser?.profileImage)}
                        alt={otherUser?.username || ''}
                        className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <span className="text-gray-600 text-sm font-semibold">
                          {otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 메시지 버블 */}
                  <div className="flex flex-col max-w-[75%] sm:max-w-[70%] md:max-w-md lg:max-w-lg">
                    <div className="px-4 py-2 rounded-2xl bg-white border border-gray-200 text-gray-900 rounded-bl-sm">
                      <p className="font-medium break-words">{message.content}</p>
                    </div>
                    <p className="text-xs mt-1 px-1 text-left text-gray-500">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </>
              )}

              {/* 본인 메시지: 메시지만 */}
              {isMine && (
                <div className="flex flex-col max-w-[75%] sm:max-w-[70%] md:max-w-md lg:max-w-lg">
                  <div className="px-4 py-2 rounded-2xl bg-blue-500 text-white rounded-br-sm">
                    <p className="font-medium break-words">{message.content}</p>
                  </div>
                  <p className="text-xs mt-1 px-1 text-right text-gray-500">
                    {formatMessageTime(message.createdAt)}
                    {message.isRead && ' · 읽음'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 font-medium"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}
