import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * CreatePostDto - 게시글 생성 DTO
 * - author 필드 제거: 인증된 사용자 정보 사용
 */
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;
}