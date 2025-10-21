import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Post 엔티티
 *
 * 게시글 정보를 관리하는 엔티티
 * Mongoose Schema에서 TypeORM Entity로 마이그레이션
 */
@Entity('posts')
export class Post {
  /**
   * UUID Primary Key
   * - MongoDB의 ObjectId를 UUID로 대체
   * - 보안: 순차적인 ID보다 예측하기 어려움
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 게시글 제목
   */
  @Column()
  title: string;

  /**
   * 게시글 내용
   * - type: 'text'로 긴 텍스트 저장 가능
   * - VARCHAR(255)의 제한을 받지 않음
   */
  @Column('text')
  content: string;

  /**
   * 조회수
   * - default: 0
   * - unsigned: true로 음수 방지 (PostgreSQL에서는 CHECK 제약조건으로 구현)
   */
  @Column({ default: 0, unsigned: true })
  views: number;

  /**
   * Post와 User의 N:1 관계
   * - ManyToOne: 여러 Post가 한 명의 User에 속함
   * - JoinColumn: Foreign Key 컬럼 이름 지정
   * - onDelete: 'CASCADE' - User 삭제 시 Post도 함께 삭제
   * - JPA의 @ManyToOne과 동일
   *
   * N+1 문제 방지:
   * - eager: false (기본값) - Lazy Loading 사용
   * - 게시글 목록 조회 시 leftJoinAndSelect로 명시적 JOIN
   *
   * 예시:
   * const posts = await postRepository.find({
   *   relations: ['author'], // 이렇게 명시해야 author 정보 로드
   * });
   *
   * 또는 QueryBuilder 사용:
   * const posts = await postRepository
   *   .createQueryBuilder('post')
   *   .leftJoinAndSelect('post.author', 'author') // JOIN으로 N+1 방지
   *   .getMany();
   */
  @ManyToOne(() => User, (user) => user.posts, {
    nullable: false,
    onDelete: 'CASCADE',
    eager: false, // N+1 문제 방지: Lazy Loading
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  /**
   * authorId: Foreign Key 컬럼
   * - User.id를 참조하는 외래키
   * - 인덱스: 특정 사용자의 게시글 조회 성능 향상
   */
  @Index()
  @Column({ type: 'uuid' })
  authorId: string;

  /**
   * 생성 시각
   * - Mongoose의 timestamps: true와 동일
   * - 인덱스: 시간순 정렬 및 최신 게시글 조회 성능 향상
   */
  @Index()
  @CreateDateColumn()
  createdAt: Date;

  /**
   * 수정 시각
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
