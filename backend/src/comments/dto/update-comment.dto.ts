import { IsString, IsNotEmpty } from 'class-validator';

/**
 * UpdateCommentDto - 댓글 수정 DTO
 */
export class UpdateCommentDto {
  /**
   * 댓글 내용
   */
  @IsString()
  @IsNotEmpty()
  content: string;
}
