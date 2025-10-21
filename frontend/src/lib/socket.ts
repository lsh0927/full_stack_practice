import { io, Socket } from 'socket.io-client';

/**
 * Socket.IO 클라이언트 설정
 */

let socket: Socket | null = null;

/**
 * Socket.IO 연결 생성
 * @param token - JWT 인증 토큰
 * @returns Socket 인스턴스
 */
export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  socket = io(`${SOCKET_URL}/chats`, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // 연결 이벤트
  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  // 연결 해제 이벤트
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  // 재연결 시도 이벤트
  socket.on('reconnect_attempt', (attempt) => {
    console.log('Reconnection attempt:', attempt);
  });

  // 에러 이벤트
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Socket 연결 해제
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * 현재 Socket 인스턴스 가져오기
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * 채팅방 참여
 */
export const joinRoom = (roomId: string) => {
  if (socket?.connected) {
    socket.emit('joinRoom', roomId);
  }
};

/**
 * 채팅방 나가기
 */
export const leaveRoom = (roomId: string) => {
  if (socket?.connected) {
    socket.emit('leaveRoom', roomId);
  }
};

/**
 * 메시지 전송
 */
export const sendMessage = (data: {
  roomId: string;
  receiverId: string;
  content: string;
}) => {
  if (socket?.connected) {
    socket.emit('message:send', data);
  }
};

/**
 * 메시지 읽음 처리
 */
export const markMessageAsRead = (data: { roomId: string; messageId?: string }) => {
  if (socket?.connected) {
    socket.emit('message:read', data);
  }
};

/**
 * 타이핑 시작
 */
export const startTyping = (roomId: string) => {
  if (socket?.connected) {
    socket.emit('typing:start', { roomId });
  }
};

/**
 * 타이핑 중지
 */
export const stopTyping = (roomId: string) => {
  if (socket?.connected) {
    socket.emit('typing:stop', { roomId });
  }
};
