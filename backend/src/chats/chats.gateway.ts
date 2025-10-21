import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';

/**
 * ChatsGateway - 실시간 채팅을 위한 WebSocket Gateway
 *
 * Socket.IO를 사용하여 실시간 메시지 전송/수신, 타이핑 표시, 읽음 표시 등을 처리
 */
@WebSocketGateway({
  namespace: 'chats',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatsGateway.name);
  private userSocketMap = new Map<string, string>(); // userId -> socketId 매핑

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatsService: ChatsService,
  ) {}

  /**
   * 클라이언트 연결 시 호출
   * JWT 토큰으로 사용자 인증 및 소켓 매핑
   */
  async handleConnection(client: Socket) {
    try {
      // 토큰 추출 (query 또는 handshake auth에서)
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`No token provided for socket ${client.id}`);
        client.disconnect();
        return;
      }

      // JWT 검증
      const payload = await this.jwtService.verifyAsync(token as string);
      const userId = payload.sub;

      // 사용자-소켓 매핑 저장
      this.userSocketMap.set(userId, client.id);
      client.data.userId = userId;

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * 클라이언트 연결 해제 시 호출
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSocketMap.delete(userId);
      this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
    }
  }

  /**
   * 특정 사용자에게 이벤트 전송
   * @param userId - 대상 사용자 ID
   * @param event - 이벤트 이름
   * @param data - 전송할 데이터
   */
  sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /**
   * 채팅방에 참여 (room join)
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.join(roomId);
    this.logger.log(`User ${client.data.userId} joined room ${roomId}`);
  }

  /**
   * 채팅방 나가기 (room leave)
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() roomId: string,
  ) {
    client.leave(roomId);
    this.logger.log(`User ${client.data.userId} left room ${roomId}`);
  }

  /**
   * 메시지 전송
   */
  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; receiverId: string; content: string },
  ) {
    try {
      const senderId = client.data.userId;

      // 메시지 저장
      const message = await this.chatsService.createMessage(
        data.roomId,
        senderId,
        data.receiverId,
        data.content,
      );

      // 채팅방에 메시지 브로드캐스트 (발신자 포함)
      this.server.to(data.roomId).emit('message:receive', {
        _id: message._id,
        roomId: message.roomId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      });

      // 수신자가 현재 온라인이면 알림
      this.sendToUser(data.receiverId, 'message:notification', {
        roomId: data.roomId,
        senderId,
        content: data.content,
      });

      this.logger.log(
        `Message sent from ${senderId} to ${data.receiverId} in room ${data.roomId}`,
      );
    } catch (error) {
      this.logger.error(`Message send error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 메시지 읽음 확인
   */
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; messageId?: string },
  ) {
    try {
      const userId = client.data.userId;

      if (data.messageId) {
        // 특정 메시지 읽음 처리
        await this.chatsService.markMessageAsRead(data.messageId, userId);
      } else {
        // 채팅방의 모든 메시지 읽음 처리
        await this.chatsService.markRoomMessagesAsRead(data.roomId, userId);
      }

      // 채팅방에 읽음 상태 브로드캐스트
      this.server.to(data.roomId).emit('message:readConfirm', {
        roomId: data.roomId,
        userId,
        messageId: data.messageId,
      });

      this.logger.log(`User ${userId} read messages in room ${data.roomId}`);
    } catch (error) {
      this.logger.error(`Message read error: ${error.message}`);
      client.emit('error', { message: error.message });
    }
  }

  /**
   * 타이핑 중 표시
   */
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;

    // 채팅방의 다른 사용자에게 타이핑 중 알림
    client.to(data.roomId).emit('typing:status', {
      roomId: data.roomId,
      userId,
      isTyping: true,
    });

    this.logger.log(`User ${userId} is typing in room ${data.roomId}`);
  }

  /**
   * 타이핑 중지
   */
  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const userId = client.data.userId;

    // 채팅방의 다른 사용자에게 타이핑 중지 알림
    client.to(data.roomId).emit('typing:status', {
      roomId: data.roomId,
      userId,
      isTyping: false,
    });

    this.logger.log(`User ${userId} stopped typing in room ${data.roomId}`);
  }
}
