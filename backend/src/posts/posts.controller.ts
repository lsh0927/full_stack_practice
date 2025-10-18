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
 * - 목록 조회, 상세 조회: 인증 불필요 (공개)
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
   * 게시글 목록 조회
   * - 인증 불필요 (공개)
   */
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.postsService.findAll(page, limit, search);
  }

  /**
   * 게시글 상세 조회
   * - 인증 불필요 (공개)
   */
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