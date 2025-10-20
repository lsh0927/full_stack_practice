import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/**
 * CreateCommentDto - 댓글 생성 DTO
 */
export class CreateCommentDto {
  /**
   * 댓글 내용
   */
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * 부모 댓글 ID (대댓글인 경우)
   * - 최상위 댓글이면 null 또는 undefined
   */
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
