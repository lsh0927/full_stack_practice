import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * PostsController - 게시글 API
 * Spring의 @RestController와 유사
 *
 * 인증 정책:
 * - 목록 조회, 상세 조회: JWT 인증 필수 (로그인한 사용자만 조회 가능)
 * - 생성, 수정, 삭제: JWT 인증 필수
 * - 조회수 증가: 인증 불필요 (누구나 조회 가능)
 */
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * 게시글 생성
   * - JWT 인증 필수
   * - @CurrentUser로 인증된 사용자 추출 (Spring의 @AuthenticationPrincipal과 유사)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.create(createPostDto, user.id);
  }

  /**
   * 팔로잉 사용자 피드 조회
   * - 팔로우한 사용자의 게시글만 표시
   * - JWT 인증 필수
   */
  @UseGuards(JwtAuthGuard)
  @Get('following')
  getFollowingFeed(
    @CurrentUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.postsService.getFollowingFeed(user.id, page, limit, search);
  }

  /**
   * 게시글 목록 조회
   * - JWT 인증 필수 (로그인한 사용자만 조회 가능)
   * - 차단한 사용자의 게시글 숨김 처리
   *
   * 페이지네이션:
   * - cursor가 제공되면 커서 기반 페이지네이션 (무한 스크롤 최적화)
   * - cursor가 없으면 기존 offset 기반 페이지네이션 (페이지 번호 기반)
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: User,
  ) {
    // 커서 기반 페이지네이션 우선
    if (cursor) {
      return this.postsService.findAllWithCursor(cursor, limit, search, user?.id);
    }
    // 기존 offset 기반 페이지네이션 (하위 호환성)
    return this.postsService.findAll(page, limit, search, user?.id);
  }

  /**
   * 게시글 상세 조회
   * - JWT 인증 필수 (로그인한 사용자만 조회 가능)
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  /**
   * 조회수 증가
   * - 인증 불필요 (누구나 조회 가능)
   */
  @Post(':id/views')
  @HttpCode(HttpStatus.OK)
  incrementViews(@Param('id') id: string) {
    return this.postsService.incrementViews(id);
  }

  /**
   * 게시글 수정
   * - JWT 인증 필수
   * - 작성자만 수정 가능 (Service에서 권한 검증)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.update(id, updatePostDto, user.id);
  }

  /**
   * 게시글 삭제
   * - JWT 인증 필수
   * - 작성자만 삭제 가능 (Service에서 권한 검증)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.remove(id, user.id);
  }
}