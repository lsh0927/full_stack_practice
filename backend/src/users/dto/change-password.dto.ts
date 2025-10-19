import { IsString, MinLength } from 'class-validator';

/**
 * ChangePasswordDto - 비밀번호 변경 DTO
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}
