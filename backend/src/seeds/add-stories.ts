import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Story } from '../stories/entities/story.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const storyRepository = app.get<Repository<Story>>(getRepositoryToken(Story));

  console.log('📸 스토리 추가 시작...');

  try {
    // 모든 유저 가져오기
    const users = await userRepository.find();
    console.log(`✅ ${users.length}명의 유저 발견`);

    // 처음 5명의 유저에게 스토리 추가
    const storyCount = Math.min(5, users.length);
    let createdStories = 0;

    for (let i = 0; i < storyCount; i++) {
      const user = users[i];
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

      // 각 유저당 1-2개의 스토리 생성
      const numStories = Math.floor(Math.random() * 2) + 1;

      for (let j = 0; j < numStories; j++) {
        try {
          const story = storyRepository.create({
            authorId: user.id,
            mediaUrl: `https://picsum.photos/seed/${user.id}-story-${j}/1080/1920`,
            mediaType: 'image',
            thumbnailUrl: `https://picsum.photos/seed/${user.id}-story-${j}/400/400`,
            expiresAt,
            viewsCount: 0,
          });

          await storyRepository.save(story);
          createdStories++;
          console.log(`  ✅ ${user.username}의 스토리 생성 (${j + 1}/${numStories})`);
        } catch (error) {
          console.error(`  ❌ ${user.username}의 스토리 생성 실패:`, error.message);
        }
      }
    }

    console.log(`\n✨ 스토리 추가 완료! (총 ${createdStories}개)`);
  } catch (error) {
    console.error('❌ 스토리 추가 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
