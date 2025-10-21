import { Injectable, Logger } from '@nestjs/common';
import {
  SendEmailDto,
  WelcomeEmailDto,
  PasswordResetEmailDto,
} from '../dto/email.dto';

/**
 * EmailService - 실제 이메일 발송 로직
 *
 * 현재는 로깅만 하지만, 실제 프로덕션에서는
 * nodemailer, SendGrid, AWS SES 등을 사용하여 이메일 발송
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  /**
   * 일반 이메일 발송
   */
  async sendEmail(emailDto: SendEmailDto): Promise<void> {
    this.logger.log(`📧 Sending email to: ${emailDto.to}`);
    this.logger.log(`Subject: ${emailDto.subject}`);

    // TODO: 실제 이메일 발송 로직 구현
    // 예시:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   from: 'noreply@board-project.com',
    //   to: emailDto.to,
    //   subject: emailDto.subject,
    //   text: emailDto.text,
    //   html: emailDto.html,
    // });

    // 개발 환경에서는 콘솔에 출력
    if (emailDto.html) {
      this.logger.debug(`HTML Content: ${emailDto.html.substring(0, 100)}...`);
    } else if (emailDto.text) {
      this.logger.debug(`Text Content: ${emailDto.text.substring(0, 100)}...`);
    }

    this.logger.log(`✅ Email sent successfully to: ${emailDto.to}`);
  }

  /**
   * 회원가입 환영 이메일 발송
   */
  async sendWelcomeEmail(dto: WelcomeEmailDto): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>환영합니다! 🎉</h1>
            </div>
            <div class="content">
              <h2>안녕하세요, ${dto.username}님!</h2>
              <p>Board Project에 가입해주셔서 감사합니다.</p>
              <p>이제 다양한 기능을 사용하실 수 있습니다:</p>
              <ul>
                <li>게시글 작성 및 관리</li>
                <li>댓글 및 답글 작성</li>
                <li>실시간 채팅</li>
                <li>프로필 관리</li>
              </ul>
              <p>궁금한 점이 있으시면 언제든지 문의해주세요!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Board Project. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: dto.to,
      subject: '🎉 Board Project 가입을 환영합니다!',
      html,
      text: `안녕하세요, ${dto.username}님! Board Project에 가입해주셔서 감사합니다.`,
    });
  }

  /**
   * 비밀번호 재설정 이메일 발송
   */
  async sendPasswordResetEmail(dto: PasswordResetEmailDto): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .warning { color: #d32f2f; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>비밀번호 재설정 🔐</h1>
            </div>
            <div class="content">
              <h2>안녕하세요, ${dto.username}님!</h2>
              <p>비밀번호 재설정 요청을 받았습니다.</p>
              <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요:</p>
              <a href="${dto.resetUrl}" class="button">비밀번호 재설정</a>
              <p class="warning">⚠️ 이 링크는 1시간 동안만 유효합니다.</p>
              <p>만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시하셔도 됩니다.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Board Project. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmail({
      to: dto.to,
      subject: '🔐 Board Project 비밀번호 재설정',
      html,
      text: `안녕하세요, ${dto.username}님! 비밀번호 재설정 링크: ${dto.resetUrl}`,
    });
  }
}
