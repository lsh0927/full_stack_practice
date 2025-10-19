import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

/**
 * UsersController - 사용자 프로필 관리 컨트롤러
 * Spring의 @RestController와 유사한 역할
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/:id - 특정 사용자 프로필 조회
   * - 사용자 정보 반환 (비밀번호 제외)
   * - 본인 여부 확인 로직 추가
   * - 해당 사용자의 게시글 수 포함
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.findByIdWithPostCount(id);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 본인 여부 확인 (req.user는 User 객체이므로 req.user.id 사용)
    const isOwnProfile = req.user.id === id;

    return {
      ...user,
      isOwnProfile,
    };
  }

  /**
   * PATCH /users/profile - 본인 프로필 수정
   * - JWT Guard로 인증 확인
   * - username, email, bio 수정 가능
   * - username, email 중복 검증
   */
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.id;

    try {
      const updatedUser =
        await this.usersService.updateProfile(userId, updateProfileDto);
      return updatedUser;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * PATCH /users/password - 비밀번호 변경
   * - 현재 비밀번호 확인 필수
   * - 새 비밀번호 해싱 후 저장
   */
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const userId = req.user.id;

    try {
      await this.usersService.changePassword(userId, changePasswordDto);
      return { message: '비밀번호가 성공적으로 변경되었습니다.' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * POST /users/profile/image - 프로필 사진 업로드
   * - 이미지 저장 후 URL 반환
   * - User 엔티티의 profileImage 업데이트
   */
  @Post('profile/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `profile-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('이미지 파일만 업로드 가능합니다.'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfileImage(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 없습니다.');
    }

    const userId = req.user.id;
    const imageUrl = `/uploads/profiles/${file.filename}`;

    await this.usersService.updateProfileImage(userId, imageUrl);

    return {
      message: '프로필 사진이 업로드되었습니다.',
      imageUrl,
    };
  }
}
