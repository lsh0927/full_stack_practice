import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { EmailService } from '../services/email.service';
import { MESSAGE_PATTERNS } from '../constants/queue.constants';
import {
  WelcomeEmailDto,
  PasswordResetEmailDto,
  SendEmailDto,
} from '../dto/email.dto';

/**
 * EmailConsumer - 이메일 큐 메시지 처리
 *
 * RabbitMQ의 email-queue에서 메시지를 수신하여 처리
 * Spring Boot의 @RabbitListener와 유사한 역할
 */
@Controller()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * 회원가입 환영 이메일 처리
   */
  @EventPattern(MESSAGE_PATTERNS.EMAIL_WELCOME)
  async handleWelcomeEmail(
    @Payload() data: WelcomeEmailDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `📨 Received WELCOME email request for: ${data.to} (${data.username})`,
    );

    try {
      await this.emailService.sendWelcomeEmail(data);
      this.logger.log(`✅ WELCOME email sent successfully to: ${data.to}`);

      // 메시지 ACK (처리 완료 확인)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send WELCOME email to: ${data.to}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true); // requeue: true
    }
  }

  /**
   * 비밀번호 재설정 이메일 처리
   */
  @EventPattern(MESSAGE_PATTERNS.EMAIL_PASSWORD_RESET)
  async handlePasswordResetEmail(
    @Payload() data: PasswordResetEmailDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `📨 Received PASSWORD_RESET email request for: ${data.to} (${data.username})`,
    );

    try {
      await this.emailService.sendPasswordResetEmail(data);
      this.logger.log(
        `✅ PASSWORD_RESET email sent successfully to: ${data.to}`,
      );

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send PASSWORD_RESET email to: ${data.to}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * 일반 알림 이메일 처리
   */
  @EventPattern(MESSAGE_PATTERNS.EMAIL_NOTIFICATION)
  async handleNotificationEmail(
    @Payload() data: SendEmailDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`📨 Received NOTIFICATION email request for: ${data.to}`);

    try {
      await this.emailService.sendEmail(data);
      this.logger.log(`✅ NOTIFICATION email sent successfully to: ${data.to}`);

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send NOTIFICATION email to: ${data.to}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }
}
