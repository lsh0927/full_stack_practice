import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './entities/block.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 사용자 차단
   * @param blockerId - 차단하는 사용자 ID
   * @param blockedId - 차단당하는 사용자 ID
   */
  async blockUser(blockerId: string, blockedId: string): Promise<Block> {
    // 자기 자신을 차단할 수 없음
    if (blockerId === blockedId) {
      throw new ConflictException('자기 자신을 차단할 수 없습니다.');
    }

    // 차단당할 사용자가 존재하는지 확인
    const blockedUser = await this.userRepository.findOne({
      where: { id: blockedId },
    });

    if (!blockedUser) {
      throw new NotFoundException('차단할 사용자를 찾을 수 없습니다.');
    }

    // 이미 차단되어 있는지 확인
    const existingBlock = await this.blockRepository.findOne({
      where: {
        blocker: { id: blockerId },
        blocked: { id: blockedId },
      },
    });

    if (existingBlock) {
      throw new ConflictException('이미 차단된 사용자입니다.');
    }

    // 차단 생성
    const block = this.blockRepository.create({
      blocker: { id: blockerId } as User,
      blocked: { id: blockedId } as User,
    });

    return await this.blockRepository.save(block);
  }

  /**
   * 차단 해제
   * @param blockerId - 차단했던 사용자 ID
   * @param blockedId - 차단당했던 사용자 ID
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const block = await this.blockRepository.findOne({
      where: {
        blocker: { id: blockerId },
        blocked: { id: blockedId },
      },
    });

    if (!block) {
      throw new NotFoundException('차단 기록을 찾을 수 없습니다.');
    }

    await this.blockRepository.remove(block);
  }

  /**
   * 내가 차단한 사용자 목록 조회
   * @param blockerId - 차단한 사용자 ID
   * @param page - 페이지 번호 (기본: 1)
   * @param limit - 페이지당 항목 수 (기본: 20)
   */
  async getBlockedUsers(
    blockerId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ blocks: Block[]; total: number; page: number; totalPages: number }> {
    const [blocks, total] = await this.blockRepository.findAndCount({
      where: { blocker: { id: blockerId } },
      relations: ['blocked'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      blocks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 특정 사용자가 차단한 사용자 ID 목록 조회 (필터링용)
   * - N+1 최적화: ID만 조회 (relations 없이)
   * @param blockerId - 차단한 사용자 ID
   */
  async getBlockedUserIds(blockerId: string): Promise<string[]> {
    const blocks = await this.blockRepository.find({
      where: { blocker: { id: blockerId } },
      select: ['blocked'],
      relations: ['blocked'],
    });

    console.log('🚫 [getBlockedUserIds] blockerId:', blockerId, 'result:', blocks);
    return blocks.map((block) => block.blocked.id);
  }

  /**
   * 특정 사용자를 차단한 사용자 ID 목록 조회 (필터링용)
   * - N+1 최적화: ID만 조회 (relations 없이)
   * @param userId - 차단당한 사용자 ID
   */
  async getBlockerUserIds(userId: string): Promise<string[]> {
    const blocks = await this.blockRepository.find({
      where: { blocked: { id: userId } },
      select: ['blocker'],
      relations: ['blocker'],
    });

    console.log('🚫 [getBlockerUserIds] userId:', userId, 'result:', blocks);
    return blocks.map((block) => block.blocker.id);
  }

  /**
   * 두 사용자 간 차단 관계 확인
   * @param userId1 - 사용자 1 ID
   * @param userId2 - 사용자 2 ID
   * @returns 차단 관계가 있으면 true
   */
  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const block = await this.blockRepository.findOne({
      where: [
        { blocker: { id: userId1 }, blocked: { id: userId2 } },
        { blocker: { id: userId2 }, blocked: { id: userId1 } },
      ],
    });

    return !!block;
  }
}
