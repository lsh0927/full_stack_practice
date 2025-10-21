import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Message 스키마 (MongoDB)
 *
 * 채팅 메시지를 MongoDB에 저장
 * 빠른 조회를 위해 NoSQL 사용
 */
@Schema({ timestamps: true, collection: 'messages' })
export class Message extends Document {
  /**
   * 채팅방 ID (ChatRoom의 ID)
   * PostgreSQL의 ChatRoom과 연결
   */
  @Prop({ required: true, index: true })
  roomId: string;

  /**
   * 발신자 ID (User의 ID)
   */
  @Prop({ required: true, index: true })
  senderId: string;

  /**
   * 수신자 ID (User의 ID)
   */
  @Prop({ required: true, index: true })
  receiverId: string;

  /**
   * 메시지 내용
   */
  @Prop({ required: true })
  content: string;

  /**
   * 읽음 여부
   */
  @Prop({ default: false })
  isRead: boolean;

  /**
   * 생성 시각 (timestamps: true로 자동 생성)
   */
  createdAt: Date;

  /**
   * 수정 시각 (timestamps: true로 자동 생성)
   */
  updatedAt: Date;
}

/**
 * Mongoose Schema 생성
 */
export const MessageSchema = SchemaFactory.createForClass(Message);

/**
 * 인덱스 설정
 * - roomId + createdAt: 채팅방별 메시지 조회 최적화
 * - senderId + receiverId: 사용자 간 메시지 조회 최적화
 */
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1 });
