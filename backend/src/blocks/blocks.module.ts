import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksController } from './blocks.controller';
import { BlocksService } from './blocks.service';
import { Block } from './entities/block.entity';
import { User } from '../users/entities/user.entity';

/**
 * BlocksModule - 사용자 차단 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Block, User]), // Block과 User Repository 등록
  ],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService], // 다른 모듈에서 BlocksService 사용 가능하도록 export
})
export class BlocksModule {}
