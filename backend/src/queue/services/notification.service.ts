import { Injectable, Logger } from '@nestjs/common';
import {
  SendNotificationDto,
  CommentNotificationDto,
  ChatMessageNotificationDto,
} from '../dto/notification.dto';

/**
 * NotificationService - 알림 발송 서비스
 *
 * 실제 알림 발송 로직을 담당
 * TODO: FCM(Firebase Cloud Messaging), 웹소켓, 웹푸시 등을 연동하여 실제 알림 발송
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * 일반 알림 발송
   */
  async sendNotification(data: SendNotificationDto): Promise<void> {
    this.logger.log(`🔔 Sending notification to user: ${data.userId}`);
    this.logger.log(`🔔 Type: ${data.type}`);
    this.logger.log(`🔔 Title: ${data.title}`);
    this.logger.log(`🔔 Message: ${data.message}`);

    if (data.metadata) {
      this.logger.debug(
        `🔔 Metadata: ${JSON.stringify(data.metadata, null, 2)}`,
      );
    }

    // TODO: 실제 알림 발송 구현
    // - FCM (Firebase Cloud Messaging) - 모바일 푸시 알림
    // - WebSocket - 실시간 웹 알림
    // - Web Push API - 브라우저 푸시 알림
    // - SMS/카카오톡 - 중요 알림

    this.logger.log(`✅ Notification sent successfully to user: ${data.userId}`);
  }

  /**
   * 댓글 알림 발송
   */
  async sendCommentNotification(data: CommentNotificationDto): Promise<void> {
    this.logger.log(
      `💬 Sending comment notification to user: ${data.postAuthorId}`,
    );
    this.logger.log(`💬 Post: ${data.postTitle}`);
    this.logger.log(`💬 Commenter: ${data.commenterUsername}`);
    this.logger.log(
      `💬 Comment: ${data.commentContent.substring(0, 50)}${data.commentContent.length > 50 ? '...' : ''}`,
    );

    // TODO: 실제 댓글 알림 발송
    // 알림 타입: "새 댓글"
    // 내용: "{commenterUsername}님이 게시글 '{postTitle}'에 댓글을 남겼습니다."
    // 클릭 시 이동: /posts/{postId}

    this.logger.log(
      `✅ Comment notification sent successfully to user: ${data.postAuthorId}`,
    );
  }

  /**
   * 채팅 메시지 알림 발송
   */
  async sendChatMessageNotification(
    data: ChatMessageNotificationDto,
  ): Promise<void> {
    this.logger.log(
      `💬 Sending chat message notification to user: ${data.recipientId}`,
    );
    this.logger.log(`💬 From: ${data.senderUsername}`);
    this.logger.log(`💬 Message preview: ${data.messagePreview}`);

    // TODO: 실제 채팅 알림 발송
    // 알림 타입: "새 메시지"
    // 내용: "{senderUsername}님이 메시지를 보냈습니다: {messagePreview}"
    // 클릭 시 이동: /chats/{roomId}

    this.logger.log(
      `✅ Chat message notification sent successfully to user: ${data.recipientId}`,
    );
  }
}
