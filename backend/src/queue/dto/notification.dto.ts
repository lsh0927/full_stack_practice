/**
 * 알림 전송을 위한 DTO
 */

/**
 * 기본 알림 DTO
 */
export class SendNotificationDto {
  userId: string; // 알림을 받을 사용자 ID
  type: 'comment' | 'chat' | 'like' | 'follow'; // 알림 타입
  title: string; // 알림 제목
  message: string; // 알림 내용
  metadata?: Record<string, any>; // 추가 데이터 (postId, commentId 등)
}

/**
 * 댓글 알림 DTO
 */
export class CommentNotificationDto {
  postAuthorId: string; // 게시글 작성자 ID
  postId: string; // 게시글 ID
  postTitle: string; // 게시글 제목
  commenterUsername: string; // 댓글 작성자 이름
  commentContent: string; // 댓글 내용
}

/**
 * 채팅 메시지 알림 DTO
 */
export class ChatMessageNotificationDto {
  recipientId: string; // 수신자 ID
  senderId: string; // 발신자 ID
  senderUsername: string; // 발신자 이름
  roomId: string; // 채팅방 ID
  messagePreview: string; // 메시지 미리보기 (처음 50자)
}
