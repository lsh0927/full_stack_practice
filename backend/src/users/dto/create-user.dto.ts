import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * CreateUserDto - 회원가입 요청 DTO
 * Spring의 @Valid + @RequestBody와 유사
 */
export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  username: string;
}
