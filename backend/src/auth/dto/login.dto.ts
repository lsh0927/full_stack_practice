import { IsEmail, IsString } from 'class-validator';

/**
 * LoginDto - 로그인 요청 DTO
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
