import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

/**
 * Like 엔티티
 *
 * 게시글 좋아요 정보를 관리하는 엔티티
 * User와 Post의 다대다 관계를 중간 테이블로 표현
 */
@Entity('likes')
@Index(['user', 'post'], { unique: true }) // 한 사용자는 같은 게시글에 한 번만 좋아요 가능
export class Like {
  /**
   * UUID Primary Key
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * userId: Foreign Key 컬럼
   * - User.id를 참조하는 외래키
   */
  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  /**
   * Like와 User의 N:1 관계
   * - ManyToOne: 여러 Like가 한 명의 User에 속함
   * - onDelete: 'CASCADE' - User 삭제 시 Like도 함께 삭제
   * - createForeignKeyConstraints: false - FK는 userId 컬럼에서 관리
   */
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * postId: Foreign Key 컬럼
   * - Post.id를 참조하는 외래키
   */
  @Column({ type: 'uuid' })
  @Index()
  postId: string;

  /**
   * Like와 Post의 N:1 관계
   * - ManyToOne: 여러 Like가 한 게시글에 속함
   * - onDelete: 'CASCADE' - Post 삭제 시 Like도 함께 삭제
   * - createForeignKeyConstraints: false - FK는 postId 컬럼에서 관리
   */
  @ManyToOne(() => Post, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false,
    createForeignKeyConstraints: false,
  })
  @JoinColumn({ name: 'postId' })
  post: Post;

  /**
   * 생성 시각
   * - 좋아요를 누른 시간 기록
   */
  @CreateDateColumn()
  createdAt: Date;
}
