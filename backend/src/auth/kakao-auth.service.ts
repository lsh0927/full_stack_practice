import { Injectable, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import axios from 'axios';

@Injectable()
export class KakaoAuthService {
  private readonly kakaoClientId: string;
  private readonly kakaoClientSecret: string;
  private readonly kakaoCallbackUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {
    this.kakaoClientId = this.configService.get<string>('KAKAO_CLIENT_ID') || '';
    this.kakaoClientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET') || '';
    this.kakaoCallbackUrl = this.configService.get<string>('KAKAO_CALLBACK_URL') || 'http://localhost:3000/auth/kakao/callback';

    if (!this.kakaoClientId) {
      console.error('KAKAO_CLIENT_ID가 설정되지 않았습니다.');
    }
  }

  /**
   * 카카오 로그인 URL 생성
   */
  getKakaoLoginUrl(): string {
    const kakaoAuthUrl = 'https://kauth.kakao.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.kakaoClientId,
      redirect_uri: this.kakaoCallbackUrl,
      response_type: 'code',
      scope: 'profile_nickname profile_image account_email',
    });

    return `${kakaoAuthUrl}?${params.toString()}`;
  }

  /**
   * 카카오 인가 코드로 액세스 토큰 교환
   */
  async getKakaoAccessToken(code: string): Promise<string> {
    const tokenUrl = 'https://kauth.kakao.com/oauth/token';

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.kakaoClientId,
      redirect_uri: this.kakaoCallbackUrl,
      code,
    });

    // Client Secret이 설정되어 있으면 추가
    if (this.kakaoClientSecret && this.kakaoClientSecret !== 'YOUR_KAKAO_CLIENT_SECRET_HERE_IF_NEEDED') {
      params.append('client_secret', this.kakaoClientSecret);
    }

    try {
      const response = await axios.post(tokenUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data.access_token;
    } catch (error) {
      console.error('카카오 토큰 교환 실패:', error.response?.data);
      throw new HttpException(
        '카카오 인증에 실패했습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  /**
   * 카카오 사용자 정보 조회
   */
  async getKakaoUserInfo(accessToken: string): Promise<any> {
    const userInfoUrl = 'https://kapi.kakao.com/v2/user/me';

    try {
      const response = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('카카오 사용자 정보 조회 실패:', error.response?.data);
      throw new HttpException(
        '사용자 정보를 가져오는데 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 카카오 로그인/회원가입 처리
   */
  async handleKakaoLogin(code: string) {
    // 1. 인가 코드로 액세스 토큰 교환
    const accessToken = await this.getKakaoAccessToken(code);

    // 2. 액세스 토큰으로 사용자 정보 조회
    const kakaoUserInfo = await this.getKakaoUserInfo(accessToken);

    // 3. 카카오 사용자 정보 추출
    const kakaoId = kakaoUserInfo.id.toString();
    const email = kakaoUserInfo.kakao_account?.email || `kakao_${kakaoId}@kakao.com`;
    const username = kakaoUserInfo.properties?.nickname || `카카오사용자${kakaoId.slice(-4)}`;
    const profileImage = kakaoUserInfo.properties?.profile_image;

    // 4. 우리 DB에서 사용자 조회 (providerId로)
    let user = await this.usersService.findByProviderId('kakao', kakaoId);

    if (!user) {
      // 5. 신규 사용자면 회원가입
      // 이메일 중복 체크 (같은 이메일로 로컬 가입한 경우)
      const existingUser = await this.usersService.findByEmail(email);

      if (existingUser) {
        // 이미 같은 이메일로 가입한 사용자가 있으면 카카오 연동
        user = await this.usersService.updateUser(existingUser.id, {
          provider: 'kakao',
          providerId: kakaoId,
          profileImage: profileImage || existingUser.profileImage,
        });
      } else {
        // 완전히 새로운 사용자
        user = await this.usersService.createKakaoUser({
          email,
          username,
          provider: 'kakao',
          providerId: kakaoId,
          profileImage,
        });
      }
    } else {
      // 6. 기존 사용자면 정보 업데이트
      user = await this.usersService.updateUser(user.id, {
        username,
        profileImage: profileImage || user.profileImage,
      });
    }

    // 7. AuthService의 login 메서드를 사용하여 JWT 토큰과 리프레시 토큰 발급
    const loginResult = await this.authService.login(user);

    // provider 정보 추가
    return {
      ...loginResult,
      user: {
        ...loginResult.user,
        provider: user.provider,
        providerId: user.providerId,
      },
    };
  }
}