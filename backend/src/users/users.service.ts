import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RedisService } from '../redis/redis.service';

/**
 * UsersService - 사용자 관리 서비스
 * Spring의 @Service와 유사한 역할
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 회원가입
   * - 이메일 중복 확인
   * - bcrypt로 비밀번호 해싱
   * - 새 사용자 생성
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, username } = createUserDto;

    // 이메일 중복 확인
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 비밀번호 해싱 (bcrypt salt rounds: 10)
    // Spring Security의 BCryptPasswordEncoder와 동일
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      provider: 'local', // 로컬 회원가입
    });

    // 저장 후 비밀번호 제외하고 반환
    const savedUser = await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = savedUser;

    return userWithoutPassword as User;
  }

  /**
   * 이메일로 사용자 찾기 (비밀번호 포함)
   * - 로그인 시 사용
   * - select: false인 password 필드를 명시적으로 가져옴
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') // select: false인 password 필드 추가
      .getOne();
  }

  /**
   * ID로 사용자 찾기
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * ID로 사용자 찾기 + 게시글 수 포함 + Redis 캐싱
   * - 프로필 조회 시 사용
   * - Redis 캐시 키: user:profile:{userId}
   * - TTL: 600초 (10분)
   */
  async findByIdWithPostCount(id: string) {
    // Redis 캐시 키 생성
    const cacheKey = `user:profile:${id}`;

    // 캐시 확인
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      console.log('✅ Cache HIT:', cacheKey);
      return cachedData;
    }

    console.log('❌ Cache MISS:', cacheKey);

    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.posts', 'post')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      return null;
    }

    const { password, posts, ...userInfo } = user as any;
    const result = {
      ...userInfo,
      postCount: posts?.length || 0,
    };

    // Redis에 캐시 저장 (TTL: 600초 = 10분)
    await this.redisService.set(cacheKey, result, 600);
    console.log('💾 Cached:', cacheKey);

    return result;
  }

  /**
   * OAuth 사용자 찾기 또는 생성
   * - Kakao 로그인 시 사용
   */
  async findOrCreateOAuthUser(
    provider: string,
    providerId: string,
    email: string,
    username: string,
    profileImage?: string,
  ): Promise<User> {
    // 기존 OAuth 사용자 찾기
    let user = await this.userRepository.findOne({
      where: { provider, providerId },
    });

    if (!user) {
      // 새 OAuth 사용자 생성
      user = this.userRepository.create({
        email,
        username,
        provider,
        providerId,
        profileImage,
        // password 필드는 생략 (nullable이므로 자동으로 null)
      });

      user = await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * 프로필 업데이트
   * - username, email, bio 수정
   * - 중복 검증
   * - 캐시 무효화
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // email 중복 검증
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    // username 중복 검증
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateProfileDto.username },
      });
      if (existingUsername) {
        throw new ConflictException('이미 사용 중인 사용자명입니다.');
      }
    }

    // 업데이트
    Object.assign(user, updateProfileDto);
    const updatedUser = await this.userRepository.save(user);

    // 프로필 캐시 무효화
    const cacheKey = `user:profile:${userId}`;
    await this.redisService.del(cacheKey);
    console.log('🗑️  Invalidated cache:', cacheKey);

    // 비밀번호 제외하고 반환
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * 비밀번호 변경
   * - 현재 비밀번호 확인
   * - 새 비밀번호 해싱 후 저장
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id: userId })
      .addSelect('user.password')
      .getOne();

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    // OAuth 사용자는 비밀번호가 없음
    if (!user.password) {
      throw new BadRequestException(
        'OAuth 로그인 사용자는 비밀번호를 변경할 수 없습니다.',
      );
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    // 비밀번호 업데이트
    user.password = hashedPassword;
    await this.userRepository.save(user);
  }

  /**
   * 프로필 이미지 업데이트
   * - 프로필 이미지 URL 저장
   * - 캐시 무효화
   */
  async updateProfileImage(userId: string, imageUrl: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    user.profileImage = imageUrl;
    await this.userRepository.save(user);

    // 프로필 캐시 무효화
    const cacheKey = `user:profile:${userId}`;
    await this.redisService.del(cacheKey);
    console.log('🗑️  Invalidated cache:', cacheKey);

    return user;
  }

  /**
   * OAuth 제공자 ID로 사용자 찾기
   * - KakaoAuthService에서 사용
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

  /**
   * 이메일로 사용자 찾기 (비밀번호 제외)
   * - OAuth 연동 시 기존 사용자 확인용
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * 카카오 사용자 생성
   * - 카카오 로그인으로 새로 가입하는 사용자
   */
  async createKakaoUser(userData: {
    email: string;
    username: string;
    provider: string;
    providerId: string;
    profileImage?: string;
  }): Promise<User> {
    const user = this.userRepository.create({
      ...userData,
      // password는 null (OAuth 사용자는 비밀번호 없음)
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  /**
   * 사용자 정보 업데이트
   * - OAuth 정보 연동 또는 프로필 업데이트
   */
  async updateUser(
    userId: string,
    updates: Partial<User>,
  ): Promise<User> {
    await this.userRepository.update(userId, updates);
    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!updatedUser) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword as User;
  }

  /**
   * 사용자 검색
   * - username 또는 email로 검색 (부분 일치)
   * - 페이지네이션 지원
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :query', { query: `%${query}%` })
      .orWhere('user.email LIKE :query', { query: `%${query}%` })
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 비밀번호 제외
    const usersWithoutPassword = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });

    return {
      data: usersWithoutPassword,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
