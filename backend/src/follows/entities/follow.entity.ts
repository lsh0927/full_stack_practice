import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Follow 엔티티
 *
 * 사용자 간의 팔로우 관계를 관리하는 엔티티
 * follower: 팔로우를 하는 사용자
 * following: 팔로우를 받는 사용자
 *
 * 복합 유니크 인덱스로 중복 팔로우 방지
 */
@Entity('follows')
@Unique(['followerId', 'followingId']) // 중복 팔로우 방지
@Index(['followerId', 'followingId']) // 조회 성능 향상
export class Follow {
  /**
   * PrimaryGeneratedColumn: Auto-increment Primary Key
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 팔로우를 하는 사용자 (팔로워)
   * ManyToOne: 한 명의 사용자가 여러 팔로우 관계를 가질 수 있음
   */
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  /**
   * 팔로우 ID (외래키)
   * 인덱스: 팔로우 목록 조회 성능 향상
   */
  @Index()
  @Column({ name: 'follower_id' })
  followerId: string;

  /**
   * 팔로우를 받는 사용자 (팔로잉)
   * ManyToOne: 한 명의 사용자가 여러 팔로우 관계를 가질 수 있음
   */
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;

  /**
   * 팔로잉 ID (외래키)
   * 인덱스: 팔로잉 목록 조회 성능 향상
   */
  @Index()
  @Column({ name: 'following_id' })
  followingId: string;

  /**
   * CreateDateColumn: 팔로우 생성 시각 자동 기록
   */
  @CreateDateColumn()
  createdAt: Date;
}
