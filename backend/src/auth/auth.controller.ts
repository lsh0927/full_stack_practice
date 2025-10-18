import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
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
  ) {}

  /**
   * 회원가입
   * POST /auth/signup
   */
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
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
}
