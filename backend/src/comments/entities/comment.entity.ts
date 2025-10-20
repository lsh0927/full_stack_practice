import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

/**
 * Comment 엔티티
 *
 * 게시글에 대한 댓글 및 대댓글을 관리하는 엔티티
 */
@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 댓글 내용
   */
  @Column('text')
  content: string;

  /**
   * 댓글 작성자 (User)
   * ManyToOne: 여러 댓글이 한 명의 User에 속함
   */
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  /**
   * 댓글이 속한 게시글 (Post)
   * ManyToOne: 여러 댓글이 하나의 Post에 속함
   */
  @ManyToOne(() => Post, {
    onDelete: 'CASCADE', // 게시글 삭제 시 댓글도 삭제
  })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column()
  postId: string;

  /**
   * 대댓글 (답글) 기능
   * 부모 댓글 - nullable: true로 최상위 댓글은 null
   */
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE', // 부모 댓글 삭제 시 답글도 삭제
  })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @Column({ nullable: true })
  parentId: string;

  /**
   * 대댓글 목록
   * OneToMany: 하나의 댓글이 여러 답글을 가질 수 있음
   */
  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  /**
   * 생성 시각
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 수정 시각
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
