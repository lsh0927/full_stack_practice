import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { ChatRoom } from './entities/chat-room.entity';
import { Message, MessageSchema } from './schemas/message.schema';
import { BlocksModule } from '../blocks/blocks.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, User]),
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret-key',
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
    BlocksModule,
  ],
  providers: [ChatsService, ChatsGateway],
  controllers: [ChatsController],
  exports: [TypeOrmModule, MongooseModule, ChatsGateway],
})
export class ChatsModule {}
