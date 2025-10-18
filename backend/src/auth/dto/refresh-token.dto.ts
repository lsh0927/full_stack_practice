import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Refresh Token 요청 DTO
 * - Access Token 갱신 시 사용
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

/**
 * Refresh Token 응답 DTO
 */
export class RefreshTokenResponseDto {
  access_token: string;
  refresh_token: string;
}

/**
 * Redis에 저장될 Refresh Token 정보
 */
export interface RefreshTokenPayload {
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}
