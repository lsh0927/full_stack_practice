/**
 * API 호출 유틸리티
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
    let errorMessage = `HTTP error! status: ${response.status}`;

    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch (e) {
      // JSON 파싱 실패 시 기본 에러 메시지 사용
    }

    throw new Error(errorMessage);
  }

  // DELETE 요청의 경우 No Content(204) 응답 처리
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }

  return response.json();
};

/**
 * 인증 API
 */
export const authApi = {
  // 로그인
  login: (email: string, password: string) =>
    authFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // 회원가입
  signup: (email: string, password: string, username: string, profileImage?: string) =>
    authFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username, profileImage }),
    }),

  // 로그아웃
  logout: () =>
    authFetch('/auth/logout', {
      method: 'POST',
    }),

  // 토큰 갱신
  refresh: (refreshToken: string) =>
    authFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  // 사용자 정보 조회
  me: () => authFetch('/auth/me'),
};

/**
 * 게시글 API
 */
export const postsApi = {
  // 게시글 목록 조회
  getPosts: (params: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    return authFetch(`/posts?${queryParams}`);
  },

  // 게시글 상세 조회
  getPost: (id: string) => authFetch(`/posts/${id}`),

  // 게시글 작성
  createPost: (data: { title: string; content: string }) =>
    authFetch('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 게시글 수정
  updatePost: (id: string, data: { title: string; content: string }) =>
    authFetch(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // 게시글 삭제
  deletePost: (id: string) =>
    authFetch(`/posts/${id}`, {
      method: 'DELETE',
    }),

  // 조회수 증가
  incrementViews: (id: string) =>
    authFetch(`/posts/${id}/views`, {
      method: 'POST',
    }),
};

/**
 * 좋아요 API
 */
export const likesApi = {
  // 좋아요 추가
  likePost: (postId: string) =>
    authFetch(`/posts/${postId}/like`, {
      method: 'POST',
    }),

  // 좋아요 취소
  unlikePost: (postId: string) =>
    authFetch(`/posts/${postId}/like`, {
      method: 'DELETE',
    }),

  // 좋아요 개수 조회
  getLikesCount: (postId: string) =>
    authFetch(`/posts/${postId}/likes/count`),

  // 좋아요 상태 확인
  getLikeStatus: (postId: string) =>
    authFetch(`/posts/${postId}/like/status`),

  // 좋아요 목록 조회
  getLikes: (postId: string, page = 1, limit = 20) =>
    authFetch(`/posts/${postId}/likes?page=${page}&limit=${limit}`),
};

/**
 * 댓글 API
 */
export const commentsApi = {
  // 댓글 목록 조회
  getComments: (postId: string) => authFetch(`/posts/${postId}/comments`),

  // 댓글 작성
  createComment: (postId: string, content: string, parentId?: string) =>
    authFetch(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    }),

  // 댓글 수정
  updateComment: (id: string, content: string) =>
    authFetch(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  // 댓글 삭제
  deleteComment: (id: string) =>
    authFetch(`/comments/${id}`, {
      method: 'DELETE',
    }),
};

/**
 * 차단 API
 */
export const blocksApi = {
  // 차단 목록 조회
  getBlocks: () => authFetch('/blocks'),

  // 사용자 차단
  blockUser: (userId: string) =>
    authFetch(`/blocks/${userId}`, {
      method: 'POST',
    }),

  // 차단 해제
  unblockUser: (userId: string) =>
    authFetch(`/blocks/${userId}`, {
      method: 'DELETE',
    }),
};

/**
 * 사용자 API
 */
export const usersApi = {
  // 사용자 정보 조회
  getUser: (id: string) => authFetch(`/users/${id}`),

  // 프로필 수정
  updateProfile: (data: { username?: string; bio?: string; profileImage?: string }) =>
    authFetch('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
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
