/**
 * API 호출 유틸리티
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * 인증된 fetch 요청
 */
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * 채팅 API
 */
export const chatApi = {
  // 채팅방 목록 조회
  getChatRooms: () => authFetch('/chats'),

  // 특정 채팅방 조회
  getChatRoom: (roomId: string) => authFetch(`/chats/${roomId}`),

  // 채팅방 생성/요청
  requestChat: (userId: string) => authFetch(`/chats/request/${userId}`, { method: 'POST' }),

  // 메시지 내역 조회
  getMessages: (roomId: string, page = 1, limit = 50) =>
    authFetch(`/chats/${roomId}/messages?page=${page}&limit=${limit}`),

  // 전체 읽지 않은 메시지 수 조회
  getUnreadCount: () => authFetch('/chats/unread-count'),

  // 채팅방별 읽지 않은 메시지 수 조회
  getUnreadCountByRoom: () => authFetch('/chats/unread-count-by-room'),
};
