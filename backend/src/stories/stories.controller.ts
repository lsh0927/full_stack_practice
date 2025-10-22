import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

// Multer 저장소 설정
const storage = diskStorage({
  destination: './uploads/stories',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// 파일 필터 (이미지/영상만 허용)
const fileFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    callback(null, true);
  } else {
    callback(new BadRequestException('이미지 또는 영상 파일만 업로드 가능합니다.'), false);
  }
};

/**
 * StoriesController - 스토리 API
 *
 * 인증 정책:
 * - 모든 엔드포인트: JWT 인증 필수
 */
@Controller('stories')
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  /**
   * 스토리 생성
   * POST /stories
   * - multipart/form-data로 파일 업로드
   * - file: 필수, 이미지 또는 영상 파일
   * - thumbnail: 선택, 영상 썸네일 파일
   * - mediaType: 필수, 'image' 또는 'video'
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('file', 2, {
      storage,
      fileFilter,
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('mediaType') mediaType: 'image' | 'video',
    @CurrentUser() user: User,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일을 업로드해주세요.');
    }

    if (!mediaType || !['image', 'video'].includes(mediaType)) {
      throw new BadRequestException('mediaType은 image 또는 video여야 합니다.');
    }

    const mainFile = files[0];
    const thumbnailFile = files[1];

    // 파일 크기 검증
    if (mediaType === 'image' && mainFile.size > 10 * 1024 * 1024) {
      throw new BadRequestException('이미지 파일은 10MB 이하여야 합니다.');
    }

    if (mediaType === 'video' && mainFile.size > 100 * 1024 * 1024) {
      throw new BadRequestException('영상 파일은 100MB 이하여야 합니다.');
    }

    return this.storiesService.createFromFile(
      mainFile,
      mediaType,
      user.id,
      thumbnailFile,
    );
  }

  /**
   * 팔로우한 사용자들의 스토리 조회
   * GET /stories/following
   * - 작성자별로 그룹화하여 반환
   */
  @Get('following')
  getFollowingStories(@CurrentUser() user: User) {
    return this.storiesService.getFollowingStories(user.id);
  }

  /**
   * 특정 사용자의 스토리 목록 조회
   * GET /stories/user/:authorId
   */
  @Get('user/:authorId')
  getUserStories(
    @Param('authorId') authorId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.getUserStories(authorId, user.id);
  }

  /**
   * 스토리 단일 조회
   * GET /stories/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.storiesService.findOne(id, user.id);
  }

  /**
   * 스토리 삭제
   * DELETE /stories/:id
   * - 본인의 스토리만 삭제 가능
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.storiesService.remove(id, user.id);
  }

  /**
   * 스토리 읽음 처리
   * POST /stories/:id/view
   */
  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  markAsViewed(@Param('id') id: string, @CurrentUser() user: User) {
    return this.storiesService.markAsViewed(id, user.id);
  }
}
