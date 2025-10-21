import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * ChatRoom 엔티티
 *
 * 1:1 채팅방 정보를 관리하는 엔티티
 * PostgreSQL에 저장되며, 채팅 참여자 정보를 관리
 */
@Entity('chat_rooms')
export class ChatRoom {
  /**
   * PrimaryGeneratedColumn: Auto-increment Primary Key
   * UUID 타입으로 고유 식별자 생성
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * 채팅방 참여자들 (1:1 채팅이므로 항상 2명)
   * ManyToMany: 사용자와 채팅방은 다대다 관계
   * - JoinTable: 중간 테이블 생성 (chat_room_participants)
   * - eager: false - N+1 문제 방지를 위한 Lazy Loading
   */
  @ManyToMany(() => User, { eager: false })
  @JoinTable({
    name: 'chat_room_participants',
    joinColumn: { name: 'chat_room_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  participants: User[];

  /**
   * CreateDateColumn: 채팅방 생성 시각 자동 기록
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * UpdateDateColumn: 마지막 업데이트 시각 자동 기록
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
