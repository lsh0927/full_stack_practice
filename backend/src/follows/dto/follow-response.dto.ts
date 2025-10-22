/**
 * 팔로우 상태 응답 DTO
 */
export class FollowResponseDto {
  /**
   * 팔로우 성공 여부
   */
  success: boolean;

  /**
   * 현재 팔로우 상태 (true: 팔로잉 중, false: 언팔로우 됨)
   */
  isFollowing: boolean;

  /**
   * 응답 메시지
   */
  message: string;

  /**
   * 팔로워 수
   */
  followersCount?: number;

  /**
   * 팔로잉 수
   */
  followingCount?: number;
}

/**
 * 팔로우 통계 응답 DTO
 */
export class FollowStatsDto {
  /**
   * 팔로워 수
   */
  followersCount: number;

  /**
   * 팔로잉 수
   */
  followingCount: number;

  /**
   * 현재 사용자가 해당 사용자를 팔로우 중인지 여부
   */
  isFollowing: boolean;

  /**
   * 해당 사용자가 현재 사용자를 팔로우 중인지 여부 (맞팔로우 확인)
   */
  isFollowedBy: boolean;
}

/**
 * 팔로우 목록 아이템 DTO
 */
export class FollowListItemDto {
  /**
   * 사용자 ID
   */
  id: string;

  /**
   * 사용자명
   */
  username: string;

  /**
   * 이메일
   */
  email: string;

  /**
   * 프로필 이미지
   */
  profileImage?: string;

  /**
   * 자기소개
   */
  bio?: string;

  /**
   * 현재 사용자가 해당 사용자를 팔로우 중인지 여부
   */
  isFollowing: boolean;

  /**
   * 해당 사용자가 현재 사용자를 팔로우 중인지 여부
   */
  isFollowedBy: boolean;

  /**
   * 팔로우 생성 시각
   */
  followedAt?: Date;
}

/**
 * 팔로우 목록 응답 DTO (페이지네이션)
 */
export class FollowListResponseDto {
  /**
   * 팔로우 목록
   */
  data: FollowListItemDto[];

  /**
   * 총 개수
   */
  total: number;

  /**
   * 현재 페이지
   */
  page: number;

  /**
   * 페이지 크기
   */
  limit: number;

  /**
   * 전체 페이지 수
   */
  totalPages: number;
}
