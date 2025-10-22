import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, In } from 'typeorm';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Story } from './entities/story.entity';
import { StoryView } from './entities/story-view.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryResponseDto } from './dto/story-response.dto';
import { FollowsService } from '../follows/follows.service';

/**
 * StoriesService - 스토리 관리 서비스
 *
 * 인스타그램 스타일의 스토리 기능 구현
 * - 24시간 후 자동 만료
 * - 팔로우한 사용자의 스토리만 조회
 * - 읽음 처리
 */
@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(StoryView)
    private readonly storyViewRepository: Repository<StoryView>,
    private readonly followsService: FollowsService,
  ) {}

  /**
   * 스토리 생성
   * - 24시간 후 자동 만료
   */
  async create(
    createStoryDto: CreateStoryDto,
    userId: string,
  ): Promise<StoryResponseDto> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = this.storyRepository.create({
      ...createStoryDto,
      authorId: userId,
      expiresAt,
      thumbnailUrl: createStoryDto.thumbnailUrl || createStoryDto.mediaUrl,
    });

    const savedStory = await this.storyRepository.save(story);

    // author 관계를 포함하여 다시 조회
    const storyWithAuthor = await this.storyRepository.findOne({
      where: { id: savedStory.id },
      relations: ['author'],
    });

    if (!storyWithAuthor) {
      throw new InternalServerErrorException('Failed to retrieve created story');
    }

    return this.toResponseDto(storyWithAuthor, false);
  }

  /**
   * 파일 업로드로부터 스토리 생성
   * - multipart/form-data로 업로드된 파일 처리
   * - 이미지 최적화 (리사이징, WebP 변환, 압축)
   * - 24시간 후 자동 만료
   */
  async createFromFile(
    file: Express.Multer.File,
    mediaType: 'image' | 'video',
    userId: string,
    thumbnailFile?: Express.Multer.File,
  ): Promise<StoryResponseDto> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    let mediaUrl: string;
    let thumbnailUrl: string;
    const filesToCleanup: string[] = [];

    try {
      // 이미지인 경우 sharp로 최적화
      if (mediaType === 'image') {
        filesToCleanup.push(file.path); // 원본 파일은 항상 정리 대상

        const optimizedFiles = await this.optimizeImage(file);
        mediaUrl = `/uploads/stories/${optimizedFiles.original}`;
        thumbnailUrl = `/uploads/stories/${optimizedFiles.thumbnail}`;

        // 원본 파일 삭제 (최적화된 파일만 보관)
        await this.cleanupFiles([file.path]);
      } else {
        // 영상은 최적화하지 않음
        mediaUrl = `/uploads/stories/${file.filename}`;
        thumbnailUrl = thumbnailFile
          ? `/uploads/stories/${thumbnailFile.filename}`
          : mediaUrl;
      }

      const story = this.storyRepository.create({
        mediaUrl,
        mediaType,
        thumbnailUrl,
        authorId: userId,
        expiresAt,
      });

      const savedStory = await this.storyRepository.save(story);

      // author 관계를 포함하여 다시 조회
      const storyWithAuthor = await this.storyRepository.findOne({
        where: { id: savedStory.id },
        relations: ['author'],
      });

      if (!storyWithAuthor) {
        throw new InternalServerErrorException('Failed to retrieve created story');
      }

      return this.toResponseDto(storyWithAuthor, false);
    } catch (error) {
      // 에러 발생 시 업로드된 파일 정리
      console.error('Story creation failed, cleaning up files:', error);

      const allFiles = [file.path];
      if (thumbnailFile) {
        allFiles.push(thumbnailFile.path);
      }
      await this.cleanupFiles(allFiles);

      throw error;
    }
  }

  /**
   * 이미지 최적화
   * - 원본: 1920px 리사이징, WebP 변환, 80% 품질
   * - 썸네일: 400px 리사이징, WebP 변환, 70% 품질
   */
  private async optimizeImage(file: Express.Multer.File): Promise<{
    original: string;
    thumbnail: string;
  }> {
    const uploadDir = './uploads/stories';
    const basename = path.parse(file.filename).name;

    try {
      // 원본 이미지 최적화 (1920px)
      const originalFilename = `${basename}-original.webp`;
      const originalPath = path.join(uploadDir, originalFilename);

      await sharp(file.path)
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toFile(originalPath);

      // 썸네일 생성 (400px)
      const thumbnailFilename = `${basename}-thumb.webp`;
      const thumbnailPath = path.join(uploadDir, thumbnailFilename);

      await sharp(file.path)
        .resize(400, 400, {
          fit: 'cover',
        })
        .webp({ quality: 70 })
        .toFile(thumbnailPath);

      console.log('Image optimization complete:', {
        original: originalFilename,
        thumbnail: thumbnailFilename,
      });

      return {
        original: originalFilename,
        thumbnail: thumbnailFilename,
      };
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new InternalServerErrorException('이미지 최적화에 실패했습니다.');
    }
  }

  /**
   * 팔로우한 사용자들의 스토리 조회
   * - 만료되지 않은 스토리만 조회
   * - 작성자별로 그룹화하여 반환
   */
  async getFollowingStories(userId: string): Promise<{
    [authorId: string]: StoryResponseDto[];
  }> {
    // 팔로우한 사용자 ID 목록 조회
    const followingIds = await this.followsService.getFollowingUserIds(userId);

    if (followingIds.length === 0) {
      return {};
    }

    // 만료되지 않은 스토리 조회
    const now = new Date();
    const stories = await this.storyRepository.find({
      where: {
        authorId: In(followingIds),
        expiresAt: MoreThan(now),
      },
      relations: ['author'],
      order: {
        createdAt: 'DESC',
      },
    });

    // 현재 사용자가 본 스토리 ID 목록 조회
    const storyIds = stories.map((story) => story.id);
    const viewedStoryIds = await this.getViewedStoryIds(userId, storyIds);

    // 작성자별로 그룹화
    const grouped: { [authorId: string]: StoryResponseDto[] } = {};

    for (const story of stories) {
      const isViewed = viewedStoryIds.includes(story.id);
      const dto = this.toResponseDto(story, isViewed);

      if (!grouped[story.authorId]) {
        grouped[story.authorId] = [];
      }
      grouped[story.authorId].push(dto);
    }

    return grouped;
  }

  /**
   * 특정 사용자의 스토리 목록 조회
   */
  async getUserStories(
    authorId: string,
    viewerId?: string,
  ): Promise<StoryResponseDto[]> {
    const now = new Date();
    const stories = await this.storyRepository.find({
      where: {
        authorId,
        expiresAt: MoreThan(now),
      },
      relations: ['author'],
      order: {
        createdAt: 'ASC', // 시간 순서대로
      },
    });

    if (!viewerId) {
      return stories.map((story) => this.toResponseDto(story, false));
    }

    // 읽음 처리 확인
    const storyIds = stories.map((story) => story.id);
    const viewedStoryIds = await this.getViewedStoryIds(viewerId, storyIds);

    return stories.map((story) => {
      const isViewed = viewedStoryIds.includes(story.id);
      return this.toResponseDto(story, isViewed);
    });
  }

  /**
   * 스토리 조회 (단일)
   */
  async findOne(id: string, viewerId?: string): Promise<StoryResponseDto> {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    // 만료 확인
    const now = new Date();
    if (story.expiresAt < now) {
      throw new NotFoundException(`Story with ID ${id} has expired`);
    }

    let isViewed = false;
    if (viewerId) {
      const view = await this.storyViewRepository.findOne({
        where: { storyId: id, viewerId },
      });
      isViewed = !!view;
    }

    return this.toResponseDto(story, isViewed);
  }

  /**
   * 스토리 삭제
   * - 본인의 스토리만 삭제 가능
   */
  async remove(id: string, userId: string): Promise<void> {
    const story = await this.storyRepository.findOne({ where: { id } });

    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }

    if (story.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    await this.storyRepository.remove(story);
  }

  /**
   * 스토리 읽음 처리
   * - 중복 조회 방지
   * - 조회수 증가
   */
  async markAsViewed(storyId: string, viewerId: string): Promise<void> {
    // 이미 봤는지 확인
    const existingView = await this.storyViewRepository.findOne({
      where: { storyId, viewerId },
    });

    if (existingView) {
      return; // 이미 본 스토리는 다시 카운트하지 않음
    }

    // 스토리 존재 확인
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }

    // 만료 확인
    const now = new Date();
    if (story.expiresAt < now) {
      throw new NotFoundException(`Story with ID ${storyId} has expired`);
    }

    try {
      // 읽음 기록 생성
      const storyView = this.storyViewRepository.create({
        storyId,
        viewerId,
      });

      await this.storyViewRepository.save(storyView);

      // 조회수 증가
      await this.storyRepository.increment({ id: storyId }, 'viewsCount', 1);
    } catch (error) {
      // Race condition으로 인한 중복 키 에러는 무시
      // (거의 동시에 두 개의 요청이 들어온 경우)
      if (error?.code === '23505' || error?.constraint?.includes('UQ_')) {
        // PostgreSQL unique violation error code
        console.log('Story already viewed, skipping duplicate view');
        return;
      }
      console.error('Error marking story as viewed:', error);
      throw error;
    }
  }

  /**
   * 만료된 스토리 삭제 (Cron Job용)
   */
  async deleteExpiredStories(): Promise<number> {
    const now = new Date();
    const result = await this.storyRepository.delete({
      expiresAt: LessThan(now),
    });

    return result.affected || 0;
  }

  /**
   * 헬퍼: 사용자가 본 스토리 ID 목록 조회
   */
  private async getViewedStoryIds(
    viewerId: string,
    storyIds: string[],
  ): Promise<string[]> {
    if (storyIds.length === 0) {
      return [];
    }

    const views = await this.storyViewRepository.find({
      where: {
        viewerId,
        storyId: In(storyIds),
      },
    });

    return views.map((view) => view.storyId);
  }

  /**
   * 헬퍼: Entity를 ResponseDto로 변환
   */
  private toResponseDto(story: Story, isViewed: boolean): StoryResponseDto {
    return {
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      thumbnailUrl: story.thumbnailUrl,
      authorId: story.authorId,
      author: {
        id: story.author.id,
        username: story.author.username,
        profileImage: story.author.profileImage || null,
      },
      expiresAt: story.expiresAt,
      viewsCount: story.viewsCount,
      isViewed,
      createdAt: story.createdAt,
    };
  }

  /**
   * 헬퍼: 파일 정리
   * - 에러 무시 (파일이 이미 삭제되었거나 권한 문제가 있을 수 있음)
   */
  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      } catch (error) {
        // 파일이 이미 삭제되었거나 접근 불가능한 경우 무시
        console.warn(`Failed to cleanup file: ${filePath}`, error);
      }
    }
  }
}
