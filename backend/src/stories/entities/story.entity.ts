import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { StoryView } from './story-view.entity';

/**
 * Story 엔티티
 *
 * 인스타그램 스타일의 스토리를 관리하는 엔티티
 * - 이미지 또는 비디오 컨텐츠
 * - 24시간 후 자동 만료
 */
@Entity('stories')
export class Story {
  /**
   * UUID Primary Key
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 스토리 미디어 URL
   * - 이미지 또는 비디오 URL
   */
  @Column()
  mediaUrl: string;

  /**
   * 미디어 타입
   * - image: 이미지
   * - video: 비디오
   */
  @Column({ type: 'enum', enum: ['image', 'video'], default: 'image' })
  mediaType: 'image' | 'video';

  /**
   * 썸네일 URL
   * - 원형 썸네일로 표시될 이미지
   * - 비디오의 경우 첫 프레임 또는 별도 썸네일
   */
  @Column({ nullable: true })
  thumbnailUrl: string;

  /**
   * 스토리와 User의 N:1 관계
   * - ManyToOne: 여러 Story가 한 명의 User에 속함
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  /**
   * authorId: Foreign Key 컬럼
   * - User.id를 참조하는 외래키
   * - 인덱스: 특정 사용자의 스토리 조회 성능 향상
   */
  @Index()
  @Column({ type: 'uuid' })
  authorId: string;

  /**
   * 만료 시각
   * - 스토리 생성 후 24시간
   * - 인덱스: 만료된 스토리 정리 쿼리 성능 향상
   */
  @Index()
  @Column()
  expiresAt: Date;

  /**
   * 조회수
   * - default: 0
   */
  @Column({ default: 0, unsigned: true })
  viewsCount: number;

  /**
   * Story와 StoryView의 1:N 관계
   * - 누가 이 스토리를 봤는지 추적
   */
  @OneToMany(() => StoryView, (storyView) => storyView.story)
  views: StoryView[];

  /**
   * 생성 시각
   * - 인덱스: 시간순 정렬 성능 향상
   */
  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
