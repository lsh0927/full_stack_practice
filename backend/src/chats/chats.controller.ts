import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './schemas/message.schema';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * POST /chats/request/:userId
   * 채팅 요청 (또는 기존 채팅방 반환)
   */
  @Post('request/:userId')
  @HttpCode(HttpStatus.OK)
  async requestChat(
    @CurrentUser() user: any,
    @Param('userId') targetUserId: string,
  ): Promise<ChatRoom> {
    return await this.chatsService.createOrGetChatRoom(user.id, targetUserId);
  }

  /**
   * GET /chats
   * 내 채팅방 목록 조회
   */
  @Get()
  async getMyChatRooms(@CurrentUser() user: any): Promise<ChatRoom[]> {
    return await this.chatsService.getUserChatRooms(user.id);
  }

  /**
   * GET /chats/unread-count
   * 읽지 않은 메시지 수 조회 (전체)
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any): Promise<{ count: number }> {
    const count = await this.chatsService.getUnreadCount(user.id);
    return { count };
  }

  /**
   * GET /chats/unread-count-by-room
   * 채팅방별 읽지 않은 메시지 수 조회
   */
  @Get('unread-count-by-room')
  async getUnreadCountByRoom(@CurrentUser() user: any): Promise<Record<string, number>> {
    return await this.chatsService.getUnreadCountByRoom(user.id);
  }

  /**
   * GET /chats/:roomId
   * 특정 채팅방 조회
   */
  @Get(':roomId')
  async getChatRoom(
    @CurrentUser() user: any,
    @Param('roomId') roomId: string,
  ): Promise<ChatRoom> {
    return await this.chatsService.getChatRoom(roomId, user.id);
  }

  /**
   * GET /chats/:roomId/messages
   * 채팅방 메시지 내역 조회
   */
  @Get(':roomId/messages')
  async getMessages(
    @CurrentUser() user: any,
    @Param('roomId') roomId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ): Promise<{ messages: Message[]; total: number; page: number; totalPages: number }> {
    return await this.chatsService.getMessages(roomId, user.id, page, limit);
  }
}
