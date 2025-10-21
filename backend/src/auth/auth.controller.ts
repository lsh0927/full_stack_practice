import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MESSAGE_PATTERNS } from '../queue/constants/queue.constants';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

/**
 * AuthController - 인증 관련 API
 * Spring Security의 AuthenticationController와 유사
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientProxy,
  ) {}

  /**
   * 회원가입
   * POST /auth/signup
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: diskStorage({
        destination: './uploads/profiles',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        // 이미지 파일만 허용
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('이미지 파일만 업로드 가능합니다.'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async signup(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // 파일이 업로드된 경우 경로 추가
    if (file) {
      createUserDto.profileImage = `/uploads/profiles/${file.filename}`;
    }

    const user = await this.usersService.create(createUserDto);

    // 🐰 회원가입 환영 이메일을 RabbitMQ 큐에 전송 (비동기)
    // 큐에 메시지만 넣고 즉시 반환 → 사용자는 이메일 발송을 기다리지 않음
    this.emailClient.emit(MESSAGE_PATTERNS.EMAIL_WELCOME, {
      to: user.email,
      username: user.username,
    });

    return this.authService.login(user);
  }

  /**
   * 로그인
   * POST /auth/login
   *
   * LocalAuthGuard가 자동으로:
   * 1. LoginDto의 email, password 추출
   * 2. LocalStrategy.validate() 호출
   * 3. 인증 성공 시 user를 req.user에 저장
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @CurrentUser() user: User) {
    return this.authService.login(user);
  }

  /**
   * 현재 사용자 정보 조회
   * GET /auth/me
   *
   * JwtAuthGuard가 자동으로:
   * 1. Authorization 헤더에서 JWT 토큰 추출
   * 2. JwtStrategy.validate() 호출
   * 3. 인증 성공 시 user를 req.user에 저장
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      provider: user.provider,
    };
  }

  /**
   * Access Token 갱신
   * POST /auth/refresh
   *
   * Refresh Token을 사용하여 새로운 Access Token 발급
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  /**
   * 로그아웃
   * POST /auth/logout
   *
   * Redis에서 Refresh Token 삭제
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { message: '로그아웃 되었습니다.' };
  }
}
