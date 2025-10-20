import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

/**
 * CommentsService - 댓글 관리 서비스
 */
@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * 댓글 생성
   * - 게시글에 댓글 작성
   * - 대댓글(답글) 작성 가능
   */
  async create(
    postId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      postId,
      authorId: userId,
    });

    return this.commentRepository.save(comment);
  }

  /**
   * 게시글의 댓글 목록 조회
   * - 대댓글도 함께 조회 (계층 구조)
   * - N+1 문제 방지: leftJoinAndSelect 사용
   */
  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { postId, parentId: IsNull() }, // 최상위 댓글만 조회
      relations: ['author', 'replies', 'replies.author'], // 작성자 및 답글 정보 포함
      order: {
        createdAt: 'DESC', // 최신순 정렬
        replies: {
          createdAt: 'ASC', // 답글은 오래된순 정렬
        },
      },
    });
  }

  /**
   * 댓글 수정
   * - 작성자만 수정 가능
   */
  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // 권한 확인: 작성자만 수정 가능
    if (comment.authorId !== userId) {
      throw new ForbiddenException('댓글을 수정할 권한이 없습니다.');
    }

    // 내용 업데이트
    comment.content = updateCommentDto.content;

    return this.commentRepository.save(comment);
  }

  /**
   * 댓글 삭제
   * - 작성자만 삭제 가능
   * - CASCADE로 대댓글도 함께 삭제
   */
  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    // 권한 확인: 작성자만 삭제 가능
    if (comment.authorId !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    await this.commentRepository.remove(comment);
  }

  /**
   * 게시글의 댓글 수 조회
   */
  async countByPost(postId: string): Promise<number> {
    return this.commentRepository.count({ where: { postId } });
  }
}
