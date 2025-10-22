import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { QueueModule } from '../queue/queue.module';
import { BlocksModule } from '../blocks/blocks.module';
import { FollowsModule } from '../follows/follows.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    QueueModule, // 이미지 처리 큐 사용
    BlocksModule, // 차단 기능 사용
    FollowsModule, // 팔로우 기능 사용
    forwardRef(() => PostsModule), // 순환 참조 방지
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // AuthModule에서 사용하기 위해 export
})
export class UsersModule {}
