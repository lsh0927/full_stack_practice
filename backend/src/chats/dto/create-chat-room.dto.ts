import { IsUUID } from 'class-validator';

/**
 * 채팅방 생성 요청 DTO
 */
export class CreateChatRoomDto {
  @IsUUID()
  targetUserId: string;
}
