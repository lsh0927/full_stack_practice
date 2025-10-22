import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';
import {
  FollowResponseDto,
  FollowStatsDto,
  FollowListItemDto,
  FollowListResponseDto,
} from './dto/follow-response.dto';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * 팔로우하기
   * @param followerId 팔로우를 하는 사용자 ID
   * @param followingId 팔로우를 받는 사용자 ID
   */
  async follow(
    followerId: string,
    followingId: string,
  ): Promise<FollowResponseDto> {
    // 자기 자신 팔로우 방지
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    // 팔로우 대상 사용자 존재 확인
    const followingUser = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!followingUser) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    // 이미 팔로우 중인지 확인
    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
      // 이미 팔로우 중이면 중복 팔로우 방지 (멱등성)
      return {
        success: true,
        isFollowing: true,
        message: '이미 팔로우 중입니다.',
      };
    }

    // 트랜잭션으로 팔로우 관계 생성 및 카운트 업데이트
    await this.dataSource.transaction(async (manager) => {
      // Follow 엔티티 생성
      const follow = manager.create(Follow, {
        followerId,
        followingId,
      });
      await manager.save(Follow, follow);

      // 팔로워 수 증가 (following user)
      await manager.increment(User, { id: followingId }, 'followersCount', 1);

      // 팔로잉 수 증가 (follower user)
      await manager.increment(User, { id: followerId }, 'followingCount', 1);
    });

    return {
      success: true,
      isFollowing: true,
      message: '팔로우했습니다.',
    };
  }

  /**
   * 언팔로우하기
   * @param followerId 팔로우를 취소하는 사용자 ID
   * @param followingId 팔로우를 취소할 대상 사용자 ID
   */
  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowResponseDto> {
    // 자기 자신 언팔로우 방지
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 언팔로우할 수 없습니다.');
    }

    // 팔로우 관계 확인
    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    if (!existingFollow) {
      // 팔로우 관계가 없으면 언팔로우 불필요 (멱등성)
      return {
        success: true,
        isFollowing: false,
        message: '팔로우하지 않은 사용자입니다.',
      };
    }

    // 트랜잭션으로 팔로우 관계 삭제 및 카운트 업데이트
    await this.dataSource.transaction(async (manager) => {
      // Follow 엔티티 삭제
      await manager.delete(Follow, { id: existingFollow.id });

      // 팔로워 수 감소 (following user)
      await manager.decrement(User, { id: followingId }, 'followersCount', 1);

      // 팔로잉 수 감소 (follower user)
      await manager.decrement(User, { id: followerId }, 'followingCount', 1);
    });

    return {
      success: true,
      isFollowing: false,
      message: '언팔로우했습니다.',
    };
  }

  /**
   * 팔로우 토글 (팔로우 중이면 언팔로우, 아니면 팔로우)
   */
  async toggleFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowResponseDto> {
    const isFollowing = await this.isFollowing(followerId, followingId);

    if (isFollowing) {
      return this.unfollow(followerId, followingId);
    } else {
      return this.follow(followerId, followingId);
    }
  }

  /**
   * 팔로우 여부 확인
   */
  async isFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    return !!follow;
  }

  /**
   * 맞팔로우 여부 확인
   */
  async checkMutualFollow(
    userId1: string,
    userId2: string,
  ): Promise<boolean> {
    const [isUser1FollowingUser2, isUser2FollowingUser1] = await Promise.all([
      this.isFollowing(userId1, userId2),
      this.isFollowing(userId2, userId1),
    ]);

    return isUser1FollowingUser2 && isUser2FollowingUser1;
  }

  /**
   * 팔로우 통계 조회
   */
  async getFollowStats(
    userId: string,
    currentUserId?: string,
  ): Promise<FollowStatsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    let isFollowing = false;
    let isFollowedBy = false;

    if (currentUserId && currentUserId !== userId) {
      [isFollowing, isFollowedBy] = await Promise.all([
        this.isFollowing(currentUserId, userId),
        this.isFollowing(userId, currentUserId),
      ]);
    }

    return {
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      isFollowing,
      isFollowedBy,
    };
  }

  /**
   * 팔로워 목록 조회
   */
  async getFollowers(
    userId: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<FollowListResponseDto> {
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = await Promise.all(
      follows.map(async (follow) => {
        const [isFollowing, isFollowedBy] = await Promise.all([
          this.isFollowing(currentUserId, follow.follower.id),
          this.isFollowing(follow.follower.id, currentUserId),
        ]);

        return {
          id: follow.follower.id,
          username: follow.follower.username,
          email: follow.follower.email,
          profileImage: follow.follower.profileImage,
          bio: follow.follower.bio,
          isFollowing,
          isFollowedBy,
          followedAt: follow.createdAt,
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 팔로잉 목록 조회
   */
  async getFollowing(
    userId: string,
    currentUserId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<FollowListResponseDto> {
    const skip = (page - 1) * limit;

    const [follows, total] = await this.followRepository.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = await Promise.all(
      follows.map(async (follow) => {
        const [isFollowing, isFollowedBy] = await Promise.all([
          this.isFollowing(currentUserId, follow.following.id),
          this.isFollowing(follow.following.id, currentUserId),
        ]);

        return {
          id: follow.following.id,
          username: follow.following.username,
          email: follow.following.email,
          profileImage: follow.following.profileImage,
          bio: follow.following.bio,
          isFollowing,
          isFollowedBy,
          followedAt: follow.createdAt,
        };
      }),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 팔로잉하는 사용자 ID 목록 조회 (피드 필터링용)
   */
  async getFollowingUserIds(userId: string): Promise<string[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      select: ['followingId'],
    });

    return follows.map((follow) => follow.followingId);
  }
}
