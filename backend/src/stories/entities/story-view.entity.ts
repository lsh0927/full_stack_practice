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
import { Story } from './story.entity';

/**
 * StoryView 엔티티
 *
 * 사용자가 스토리를 본 기록을 관리하는 엔티티
 * - 중복 조회 방지
 * - 읽음 처리 및 숨김 처리
 */
@Entity('story_views')
@Unique(['storyId', 'viewerId']) // 중복 조회 방지
@Index(['storyId', 'viewerId']) // 조회 성능 향상
export class StoryView {
  /**
   * UUID Primary Key
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 조회된 스토리
   * ManyToOne: 여러 StoryView가 하나의 Story에 속함
   */
  @ManyToOne(() => Story, (story) => story.views, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'story_id' })
  story: Story;

  /**
   * 스토리 ID (외래키)
   * 인덱스: 특정 스토리의 조회 기록 조회 성능 향상
   */
  @Index()
  @Column({ name: 'story_id' })
  storyId: string;

  /**
   * 조회한 사용자
   * ManyToOne: 여러 StoryView가 하나의 User에 속함
   */
  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewer_id' })
  viewer: User;

  /**
   * 조회자 ID (외래키)
   * 인덱스: 특정 사용자의 조회 기록 조회 성능 향상
   */
  @Index()
  @Column({ name: 'viewer_id' })
  viewerId: string;

  /**
   * 조회 시각
   * - 자동 기록
   */
  @CreateDateColumn()
  viewedAt: Date;
}
