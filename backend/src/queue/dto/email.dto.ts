/**
 * 이메일 발송 DTO
 * RabbitMQ 메시지로 전송되는 이메일 정보
 */

export class SendEmailDto {
  to: string; // 수신자 이메일
  subject: string; // 제목
  text?: string; // 텍스트 내용
  html?: string; // HTML 내용
}

/**
 * 회원가입 환영 이메일 DTO
 */
export class WelcomeEmailDto {
  to: string; // 수신자 이메일
  username: string; // 사용자명
}

/**
 * 비밀번호 재설정 이메일 DTO
 */
export class PasswordResetEmailDto {
  to: string; // 수신자 이메일
  username: string; // 사용자명
  resetToken: string; // 재설정 토큰
  resetUrl: string; // 재설정 URL
}
