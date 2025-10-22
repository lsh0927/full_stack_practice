import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Story } from '../stories/entities/story.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../redis/redis.service';

/**
 * 시드 데이터 생성 스크립트
 *
 * 20명의 유저와 각 유저당 5개의 게시물을 생성합니다.
 * 또한 랜덤하게 팔로우 관계를 생성합니다.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const postRepository = app.get<Repository<Post>>(getRepositoryToken(Post));
  const followRepository = app.get<Repository<Follow>>(
    getRepositoryToken(Follow),
  );
  const storyRepository = app.get<Repository<Story>>(
    getRepositoryToken(Story),
  );
  const redisService = app.get<RedisService>(RedisService);

  console.log('🌱 시드 데이터 생성 시작...');

  try {
    // 기존 데이터 삭제 (선택사항)
    console.log('📝 기존 시드 데이터 확인 중...');

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 20명의 유저 생성
    console.log('👥 20명의 유저 생성 중...');
    const users: User[] = [];

    const usernames = [
      '김철수', '이영희', '박민수', '정수연', '최지훈',
      '강서연', '윤도현', '임나영', '한재민', '오서진',
      '신동욱', '배수지', '송지은', '안현우', '조미나',
      '권태양', '황예린', '문성호', '유채원', '서준호'
    ];

    const bios = [
      '안녕하세요! 반갑습니다 😊',
      '개발자입니다 💻',
      '일상을 공유합니다 ✨',
      '여행을 좋아해요 ✈️',
      '음악이 좋아요 🎵',
      '책 읽기를 즐깁니다 📚',
      '운동하는 것을 좋아합니다 🏃',
      '요리에 관심이 많아요 🍳',
      '사진 찍는 것을 좋아합니다 📷',
      '게임을 즐겨합니다 🎮'
    ];

    for (let i = 0; i < 20; i++) {
      const user = userRepository.create({
        email: `user${i + 1}@example.com`,
        password: hashedPassword,
        username: usernames[i],
        provider: 'local',
        bio: bios[i % bios.length],
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${usernames[i]}`,
        followersCount: 0,
        followingCount: 0,
      });

      const savedUser = await userRepository.save(user);
      users.push(savedUser);
      console.log(`  ✅ 유저 생성: ${savedUser.username} (${savedUser.email})`);
    }

    // 각 유저당 5개의 게시물 생성
    console.log('\n📝 각 유저당 5개의 게시물 생성 중...');

    const postTitles = [
      '오늘의 일상',
      '주말 여행기',
      '맛집 후기',
      '독서 노트',
      '개발 팁',
      '운동 루틴',
      '요리 레시피',
      '사진 공유',
      '음악 추천',
      '영화 리뷰'
    ];

    const postContents = [
      '오늘 하루도 즐겁게 보냈습니다. 모두들 좋은 하루 보내세요!',
      '주말에 다녀온 여행지가 너무 좋았어요. 다음에 또 가고 싶네요.',
      '오늘 다녀온 맛집이 정말 맛있었어요. 강력 추천합니다!',
      '요즘 읽고 있는 책이 너무 재미있어요. 여러분도 한번 읽어보세요.',
      '개발하면서 유용한 팁을 공유합니다. 도움이 되었으면 좋겠어요.',
      '요즘 하고 있는 운동 루틴을 공유해요. 함께 건강해져요!',
      '집에서 만든 요리 레시피를 공유합니다. 쉽고 맛있어요.',
      '오늘 찍은 사진들을 공유합니다. 날씨가 정말 좋았어요.',
      '요즘 자주 듣는 음악을 추천합니다. 좋은 음악이에요.',
      '주말에 본 영화가 정말 재미있었어요. 추천합니다!'
    ];

    let postCount = 0;
    for (const user of users) {
      for (let j = 0; j < 5; j++) {
        const titleIndex = (postCount + j) % postTitles.length;
        const contentIndex = (postCount + j) % postContents.length;

        const post = postRepository.create({
          title: `${postTitles[titleIndex]} ${j + 1}`,
          content: postContents[contentIndex],
          authorId: user.id,
          views: Math.floor(Math.random() * 100),
          likesCount: Math.floor(Math.random() * 20),
        });

        await postRepository.save(post);
      }
      postCount += 5;
      console.log(`  ✅ ${user.username}의 게시물 5개 생성 완료`);
    }

    // 랜덤하게 팔로우 관계 생성
    console.log('\n👫 팔로우 관계 생성 중...');
    const followRelations = new Set<string>();

    for (const user of users) {
      // 각 유저가 3~7명을 팔로우하도록 설정
      const followCount = Math.floor(Math.random() * 5) + 3;
      let followed = 0;

      while (followed < followCount) {
        const randomUser = users[Math.floor(Math.random() * users.length)];

        // 자기 자신을 팔로우하지 않도록
        if (randomUser.id === user.id) continue;

        // 중복 팔로우 방지
        const relationKey = `${user.id}-${randomUser.id}`;
        if (followRelations.has(relationKey)) continue;

        try {
          const follow = followRepository.create({
            followerId: user.id,
            followingId: randomUser.id,
          });

          await followRepository.save(follow);
          followRelations.add(relationKey);
          followed++;
        } catch (error) {
          // 중복 팔로우 에러 무시
          continue;
        }
      }
    }

    // 팔로워/팔로잉 카운트 업데이트
    console.log('\n🔄 팔로워/팔로잉 카운트 업데이트 중...');
    for (const user of users) {
      const followersCount = await followRepository.count({
        where: { followingId: user.id },
      });

      const followingCount = await followRepository.count({
        where: { followerId: user.id },
      });

      await userRepository.update(user.id, {
        followersCount,
        followingCount,
      });

      console.log(`  ✅ ${user.username}: 팔로워 ${followersCount}명, 팔로잉 ${followingCount}명`);
    }

    // 스토리 생성 (일부 유저만, 임의로 5명 선택)
    console.log('\n📸 스토리 생성 중...');
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

    console.log('\n✨ 시드 데이터 생성 완료!');
    console.log(`📊 생성된 데이터:`);
    console.log(`   - 유저: ${users.length}명`);
    console.log(`   - 게시물: ${users.length * 5}개`);
    console.log(`   - 팔로우 관계: ${followRelations.size}개`);
    console.log(`   - 스토리: ${createdStories}개`);

    // Redis 캐시 무효화
    console.log('\n🗑️  Redis 캐시 무효화 중...');
    await redisService.delByPattern('posts:list:*');
    console.log('✅ Redis 캐시가 성공적으로 삭제되었습니다.');

  } catch (error) {
    console.error('❌ 시드 데이터 생성 중 오류 발생:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
