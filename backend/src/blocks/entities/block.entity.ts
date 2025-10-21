import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Block 엔티티
 *
 * 사용자 간 차단 관계를 관리하는 엔티티
 * - blocker: 차단을 한 사용자
 * - blocked: 차단당한 사용자
 */
@Entity('blocks')
@Unique(['blocker', 'blocked']) // 같은 사용자를 중복으로 차단할 수 없음
@Index(['blocker']) // 내가 차단한 사용자 목록 조회 성능 향상
@Index(['blocked']) // 나를 차단한 사용자 목록 조회 성능 향상
export class Block {
  /**
   * Primary Key
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 차단을 한 사용자
   * - ManyToOne: 한 명의 User가 여러 명을 차단할 수 있음
   * - nullable: false - 차단하는 사용자는 필수
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  /**
   * 차단당한 사용자
   * - ManyToOne: 한 명의 User가 여러 명에게 차단당할 수 있음
   * - nullable: false - 차단당하는 사용자는 필수
   */
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;

  /**
   * 차단된 시각
   */
  @CreateDateColumn()
  createdAt: Date;
}
