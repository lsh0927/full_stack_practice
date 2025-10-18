import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Post } from '../../posts/entities/post.entity';

/**
 * User 엔티티
 *
 * 사용자 인증 및 게시글 작성자 정보를 관리하는 엔티티
 * Spring JPA의 @Entity와 동일한 역할
 */
@Entity('users')
export class User {
  /**
   * PrimaryGeneratedColumn: Auto-increment Primary Key
   * JPA의 @GeneratedValue(strategy = GenerationType.IDENTITY)와 동일
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 이메일 (로그인 ID)
   * - unique: true로 중복 방지
   * - DB 레벨에서 UNIQUE 제약조건 생성
   */
  @Column({ unique: true })
  email: string;

  /**
   * 비밀번호 (bcrypt 해시)
   * - select: false로 기본 쿼리에서 제외
   * - 보안을 위해 명시적으로 선택할 때만 조회 가능
   * - JPA의 @JsonIgnore와 유사한 역할
   */
  @Column({ select: false })
  password: string;

  /**
   * 사용자 이름 (닉네임)
   */
  @Column()
  username: string;

  /**
   * OAuth 제공자 (local, kakao 등)
   * - nullable: true로 로컬 가입 시 null 허용
   */
  @Column({ nullable: true })
  provider: string;

  /**
   * OAuth 제공자의 고유 ID
   * - Kakao의 경우 카카오 사용자 ID
   */
  @Column({ nullable: true })
  providerId: string;

  /**
   * 프로필 이미지 URL
   */
  @Column({ nullable: true })
  profileImage: string;

  /**
   * User와 Post의 1:N 관계
   * - OneToMany: 한 명의 User가 여러 Post를 작성
   * - cascade: ['insert', 'update'] - User 저장 시 Post도 함께 저장
   * - JPA의 @OneToMany(mappedBy = "author")와 동일
   *
   * N+1 문제 방지:
   * - eager: false (기본값) - Lazy Loading 사용
   * - 필요할 때만 relations: ['posts']로 명시적으로 로드
   */
  @OneToMany(() => Post, (post) => post.author, {
    cascade: ['insert', 'update'],
    eager: false, // N+1 문제 방지: Lazy Loading
  })
  posts: Post[];

  /**
   * CreateDateColumn: 생성 시각 자동 기록
   * JPA의 @CreatedDate와 동일
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * UpdateDateColumn: 수정 시각 자동 업데이트
   * JPA의 @LastModifiedDate와 동일
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
