import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationService } from '../services/notification.service';
import { MESSAGE_PATTERNS } from '../constants/queue.constants';
import {
  SendNotificationDto,
  CommentNotificationDto,
  ChatMessageNotificationDto,
} from '../dto/notification.dto';

/**
 * NotificationConsumer - 알림 큐 메시지 처리
 *
 * RabbitMQ의 notification-queue에서 메시지를 수신하여 처리
 */
@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 게시글 댓글 알림 처리
   */
  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_COMMENT)
  async handleCommentNotification(
    @Payload() data: CommentNotificationDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `🔔 Received COMMENT notification for user: ${data.postAuthorId}`,
    );

    try {
      await this.notificationService.sendCommentNotification(data);
      this.logger.log(
        `✅ COMMENT notification sent successfully to: ${data.postAuthorId}`,
      );

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send COMMENT notification to: ${data.postAuthorId}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * 채팅 메시지 알림 처리
   */
  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_CHAT)
  async handleChatMessageNotification(
    @Payload() data: ChatMessageNotificationDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `🔔 Received CHAT MESSAGE notification for user: ${data.recipientId}`,
    );

    try {
      await this.notificationService.sendChatMessageNotification(data);
      this.logger.log(
        `✅ CHAT MESSAGE notification sent successfully to: ${data.recipientId}`,
      );

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send CHAT MESSAGE notification to: ${data.recipientId}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * 일반 알림 처리
   */
  @EventPattern('notification.general')
  async handleGeneralNotification(
    @Payload() data: SendNotificationDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `🔔 Received GENERAL notification for user: ${data.userId}`,
    );

    try {
      await this.notificationService.sendNotification(data);
      this.logger.log(
        `✅ GENERAL notification sent successfully to: ${data.userId}`,
      );

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send GENERAL notification to: ${data.userId}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }
}
