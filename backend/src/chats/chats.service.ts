import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './schemas/message.schema';
import { BlocksService } from '../blocks/blocks.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    private readonly blocksService: BlocksService,
  ) {}

  /**
   * 채팅방 생성 또는 기존 채팅방 반환
   * @param requesterId - 채팅을 요청하는 사용자 ID
   * @param targetUserId - 채팅 대상 사용자 ID
   */
  async createOrGetChatRoom(
    requesterId: string,
    targetUserId: string,
  ): Promise<ChatRoom> {
    // 자기 자신과 채팅 불가
    if (requesterId === targetUserId) {
      throw new ConflictException('자기 자신과 채팅할 수 없습니다.');
    }

    // 대상 사용자 존재 확인
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('대상 사용자를 찾을 수 없습니다.');
    }

    // 차단 관계 확인
    const isBlocked = await this.blocksService.isBlocked(
      requesterId,
      targetUserId,
    );

    if (isBlocked) {
      throw new ForbiddenException('차단된 사용자와는 채팅할 수 없습니다.');
    }

    // 기존 채팅방 확인
    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.participants', 'participant1')
      .innerJoin('chatRoom.participants', 'participant2')
      .where('participant1.id = :userId1', { userId1: requesterId })
      .andWhere('participant2.id = :userId2', { userId2: targetUserId })
      .getOne();

    if (existingRoom) {
      // 기존 채팅방 반환 (participants 포함)
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: existingRoom.id },
        relations: ['participants'],
      });

      if (!chatRoom) {
        throw new NotFoundException('채팅방을 찾을 수 없습니다.');
      }

      return chatRoom;
    }

    // 새 채팅방 생성
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('요청자를 찾을 수 없습니다.');
    }

    const chatRoom = this.chatRoomRepository.create({
      participants: [requester, targetUser],
    });

    return await this.chatRoomRepository.save(chatRoom);
  }

  /**
   * 사용자의 모든 채팅방 조회
   * @param userId - 사용자 ID
   */
  async getUserChatRooms(userId: string): Promise<any[]> {
    const chatRooms = await this.chatRoomRepository
      .createQueryBuilder('chatRoom')
      .innerJoin('chatRoom.participants', 'participant')
      .where('participant.id = :userId', { userId })
      .leftJoinAndSelect('chatRoom.participants', 'allParticipants')
      .orderBy('chatRoom.updatedAt', 'DESC')
      .getMany();

    // 차단한 사용자 ID 목록 조회
    const blockedUserIds = await this.blocksService.getBlockedUserIds(userId);

    // 차단한 사용자와의 채팅방 제외
    const filteredChatRooms = chatRooms.filter((room) => {
      const otherParticipant = room.participants.find((p) => p.id !== userId);
      return !blockedUserIds.includes(otherParticipant?.id || '');
    });

    // 각 채팅방의 마지막 메시지 가져오기
    const chatRoomsWithLastMessage = await Promise.all(
      filteredChatRooms.map(async (room) => {
        const lastMessage = await this.messageModel
          .findOne({ roomId: room.id })
          .sort({ createdAt: -1 })
          .exec();

        return {
          ...room,
          lastMessage: lastMessage
            ? {
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : null,
        };
      }),
    );

    return chatRoomsWithLastMessage;
  }

  /**
   * 특정 채팅방 조회
   * @param roomId - 채팅방 ID
   * @param userId - 요청 사용자 ID (권한 확인용)
   */
  async getChatRoom(roomId: string, userId: string): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['participants'],
    });

    if (!chatRoom) {
      throw new NotFoundException('채팅방을 찾을 수 없습니다.');
    }

    // 참여자 확인
    const isParticipant = chatRoom.participants.some(
      (participant) => participant.id === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('채팅방에 접근할 권한이 없습니다.');
    }

    return chatRoom;
  }

  /**
   * 채팅방의 메시지 내역 조회 (페이지네이션)
   * @param roomId - 채팅방 ID
   * @param userId - 요청 사용자 ID (권한 확인용)
   * @param page - 페이지 번호 (기본: 1)
   * @param limit - 페이지당 항목 수 (기본: 50)
   */
  async getMessages(
    roomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: Message[]; total: number; page: number; totalPages: number }> {
    // 채팅방 권한 확인
    const chatRoom = await this.getChatRoom(roomId, userId);

    // 차단한 사용자 ID 목록 조회
    const blockedUserIds = await this.blocksService.getBlockedUserIds(userId);

    // 메시지 조회 (차단한 사용자의 메시지 제외)
    const skip = (page - 1) * limit;
    const query = {
      roomId,
      ...(blockedUserIds.length > 0 && {
        senderId: { $nin: blockedUserIds },
      }),
    };

    const [messages, total] = await Promise.all([
      this.messageModel
        .find(query)
        .sort({ createdAt: -1 }) // 최신순
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments(query),
    ]);

    return {
      messages: messages.reverse(), // 오래된 순으로 변환
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 메시지 전송 및 MongoDB에 저장
   * @param roomId - 채팅방 ID
   * @param senderId - 발신자 ID
   * @param receiverId - 수신자 ID
   * @param content - 메시지 내용
   *
   * 참고: 차단된 사용자도 메시지를 보낼 수 있습니다.
   * - 차단당한 사용자는 눈치채지 못하도록 정상 동작
   * - 메시지는 DB에 저장됨 (차단 해제 시 복구 가능)
   * - 차단한 사용자는 메시지를 못 봄 (getMessages에서 필터링)
   */
  async createMessage(
    roomId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    // 채팅방 권한 확인
    await this.getChatRoom(roomId, senderId);

    // 메시지 생성 및 저장 (차단 여부와 관계없이 저장)
    const message = new this.messageModel({
      roomId,
      senderId,
      receiverId,
      content,
      isRead: false,
    });

    return await message.save();
  }

  /**
   * 메시지 읽음 처리
   * @param messageId - 메시지 ID
   * @param userId - 읽은 사용자 ID
   */
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException('메시지를 찾을 수 없습니다.');
    }

    // 수신자만 읽음 처리 가능
    if (message.receiverId !== userId) {
      throw new ForbiddenException('메시지를 읽음 처리할 권한이 없습니다.');
    }

    message.isRead = true;
    await message.save();
  }

  /**
   * 채팅방의 모든 메시지 읽음 처리
   * @param roomId - 채팅방 ID
   * @param userId - 읽은 사용자 ID
   */
  async markRoomMessagesAsRead(roomId: string, userId: string): Promise<void> {
    // 채팅방 권한 확인
    await this.getChatRoom(roomId, userId);

    // 해당 사용자가 받은 읽지 않은 메시지를 모두 읽음 처리
    await this.messageModel.updateMany(
      { roomId, receiverId: userId, isRead: false },
      { isRead: true },
    );
  }

  /**
   * 사용자의 읽지 않은 메시지 수 조회
   * @param userId - 사용자 ID
   * @returns 읽지 않은 메시지 수 (차단한 사용자의 메시지 제외)
   */
  async getUnreadCount(userId: string): Promise<number> {
    // 차단한 사용자 ID 목록 조회
    const blockedUserIds = await this.blocksService.getBlockedUserIds(userId);

    // 차단한 사용자의 메시지를 제외한 읽지 않은 메시지 수 조회
    const query: any = {
      receiverId: userId,
      isRead: false,
    };

    // 차단한 사용자가 있으면 해당 사용자의 메시지 제외
    if (blockedUserIds.length > 0) {
      query.senderId = { $nin: blockedUserIds };
    }

    return await this.messageModel.countDocuments(query);
  }

  /**
   * 채팅방별 읽지 않은 메시지 수 조회
   * @param userId - 사용자 ID
   * @returns 채팅방별 읽지 않은 메시지 수 맵
   */
  async getUnreadCountByRoom(userId: string): Promise<Record<string, number>> {
    const unreadMessages = await this.messageModel.aggregate([
      {
        $match: {
          receiverId: userId,
          isRead: false,
        },
      },
      {
        $group: {
          _id: '$roomId',
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {};
    unreadMessages.forEach((item) => {
      result[item._id] = item.count;
    });

    return result;
  }
}
