import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * UsersService - 사용자 관리 서비스
 * Spring의 @Service와 유사한 역할
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    delete savedUser.password;

    return savedUser;
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
        password: null, // OAuth 사용자는 비밀번호 없음
      });

      user = await this.userRepository.save(user);
    }

    return user;
  }
}
