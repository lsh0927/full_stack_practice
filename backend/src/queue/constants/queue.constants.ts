/**
 * RabbitMQ 큐 이름 상수
 *
 * 각 비동기 작업별로 독립적인 큐를 사용
 */
export const QUEUE_NAMES = {
  EMAIL: 'email-queue',           // 이메일 발송 큐
  NOTIFICATION: 'notification-queue', // 알림 전송 큐
  IMAGE: 'image-queue',           // 이미지 처리 큐
} as const;

/**
 * RabbitMQ 메시지 패턴
 *
 * 각 큐에서 처리할 이벤트 패턴 정의
 */
export const MESSAGE_PATTERNS = {
  // 이메일 패턴
  EMAIL_WELCOME: 'email.welcome',           // 회원가입 환영 이메일
  EMAIL_PASSWORD_RESET: 'email.password.reset', // 비밀번호 재설정
  EMAIL_NOTIFICATION: 'email.notification',  // 일반 알림 이메일

  // 알림 패턴
  NOTIFICATION_COMMENT: 'notification.comment',       // 댓글 알림
  NOTIFICATION_REPLY: 'notification.reply',           // 답글 알림
  NOTIFICATION_LIKE: 'notification.like',             // 좋아요 알림
  NOTIFICATION_FOLLOW: 'notification.follow',         // 팔로우 알림
  NOTIFICATION_MENTION: 'notification.mention',       // 멘션 알림
  NOTIFICATION_CHAT: 'notification.chat',             // 채팅 알림
  NOTIFICATION_KAKAO: 'notification.kakao',           // 카카오톡 알림

  // 이미지 처리 패턴
  IMAGE_RESIZE: 'image.resize',               // 이미지 리사이징
  IMAGE_OPTIMIZE: 'image.optimize',           // 이미지 최적화
  IMAGE_THUMBNAIL: 'image.thumbnail',         // 썸네일 생성
} as const;
