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
      } catch (err) {
        const message = err instanceof Error ? err.message : '채팅방을 불러오지 못했습니다.';
        setError(message);
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
      setMessages((prev) => {
        // 중복 메시지 방지
        const isDuplicate = prev.some((m) => m._id === message._id);
        if (isDuplicate) {
          return prev;
        }

        // 임시 메시지를 실제 메시지로 교체
        if (message.senderId === user?.id) {
          // 같은 내용의 임시 메시지 찾기
          const tempMessageIndex = prev.findIndex(
            (m) => m._id.startsWith('temp-') && m.content === message.content && m.senderId === user?.id
          );

          if (tempMessageIndex !== -1) {
            // 임시 메시지를 실제 메시지로 교체
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = message;
            return newMessages;
          }
        }

        return [...prev, message];
      });
      scrollToBottom();

      // 상대방의 메시지인 경우 읽음 처리
      if (message.senderId !== user?.id) {
        markMessageAsRead({ roomId, messageId: message._id });
      }
    });

    // 읽음 처리 확인 이벤트 수신
    socket.on('message:readConfirm', (data: { roomId: string; userId: string; messageId?: string }) => {
      if (data.userId !== user?.id) {
        setMessages((prev) =>
          prev.map((msg) => {
            // 특정 메시지 읽음 처리
            if (data.messageId && msg._id === data.messageId && msg.senderId === user?.id) {
              return { ...msg, isRead: true };
            }
            // 채팅방 전체 메시지 읽음 처리
            if (!data.messageId && msg.senderId === user?.id && msg.receiverId === data.userId) {
              return { ...msg, isRead: true };
            }
            return msg;
          })
        );
      }
    });

    // 타이핑 상태 수신
    socket.on('typing:status', (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    });

    // 에러 처리 (개발 디버깅용)
    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
    });

    // cleanup
    return () => {
      leaveRoom(roomId);
      socket.off('message:receive');
      socket.off('message:readConfirm');
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

    const messageContent = newMessage.trim();

    // 낙관적 업데이트: 메시지를 즉시 화면에 표시
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`, // 임시 ID
      roomId,
      senderId: user.id,
      receiverId: otherUser.id,
      content: messageContent,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    // 서버로 메시지 전송
    sendMessage({
      roomId,
      receiverId: otherUser.id,
      content: messageContent,
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="text-lg text-gray-900 dark:text-gray-100">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* 인스타그램 스타일 헤더 */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 뒤로가기 버튼 */}
            <button
              onClick={() => router.push('/chats')}
              className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-2"
              title="뒤로"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 사용자 정보 - 중앙 */}
            {otherUser && (
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => router.push(`/profile/${otherUser.id}`)}
              >
                {getProfileImageUrl(otherUser.profileImage) ? (
                  <img
                    src={getProfileImageUrl(otherUser.profileImage)}
                    alt={otherUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {otherUser.username[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{otherUser.username}</h2>
                  {isTyping && <p className="text-xs text-gray-500 dark:text-gray-400">입력 중...</p>}
                </div>
              </div>
            )}

            {/* 홈 버튼 */}
            <button
              onClick={() => router.push('/')}
              className="text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-colors p-2"
              title="홈으로"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 max-w-4xl mx-auto w-full transition-colors duration-200">
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 flex items-center justify-center hover:opacity-80 transition-opacity">
                        <span className="text-white text-sm font-semibold">
                          {otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 메시지 버블 */}
                  <div className="flex flex-col max-w-[75%] sm:max-w-[70%] md:max-w-md lg:max-w-lg">
                    <div className="px-4 py-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm">
                      <p className="font-medium break-words">{message.content}</p>
                    </div>
                    <p className="text-xs mt-1 px-1 text-left text-gray-500 dark:text-gray-400">
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </>
              )}

              {/* 본인 메시지: 메시지만 */}
              {isMine && (
                <div className="flex flex-col max-w-[75%] sm:max-w-[70%] md:max-w-md lg:max-w-lg">
                  <div className="px-4 py-2 rounded-2xl bg-blue-500 dark:bg-blue-600 text-white rounded-br-sm">
                    <p className="font-medium break-words">{message.content}</p>
                  </div>
                  <p className="text-xs mt-1 px-1 text-right text-gray-500 dark:text-gray-400">
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
      <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-medium"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
        </div>
      </form>
    </div>
  );
}
