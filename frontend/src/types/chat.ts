/**
 * 채팅 관련 타입 정의
 */

export interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
}

export interface ChatRoom {
  id: string;
  participants: User[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}
