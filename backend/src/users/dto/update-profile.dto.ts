import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

/**
 * UpdateProfileDto - 프로필 수정 DTO
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
