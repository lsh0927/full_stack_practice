/**
 * 유틸리티 함수 모음
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * 프로필 이미지 URL 처리
 * - 카카오 OAuth 등 외부 URL은 그대로 반환
 * - 상대 경로는 절대 경로로 변환
 * @param imageUrl - 프로필 이미지 URL
 * @returns 처리된 이미지 URL
 */
export const getProfileImageUrl = (imageUrl?: string): string | undefined => {
  if (!imageUrl) return undefined;

  // 외부 URL인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 상대 경로인 경우 API 서버 URL과 결합
  if (imageUrl.startsWith('/')) {
    return `${API_URL}${imageUrl}`;
  }

  // 그 외의 경우 API 서버 URL과 결합
  return `${API_URL}/${imageUrl}`;
};

/**
 * 날짜 포맷팅 (한국 시각 기준)
 * @param date - 날짜 문자열 또는 Date 객체
 * @returns 포맷된 날짜 문자열
 */
export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // 한국 시각으로 변환 (UTC+9)
  const koreaOffset = 9 * 60 * 60 * 1000;
  const koreaTime = new Date(now.getTime() + koreaOffset);
  const targetTime = new Date(d.getTime() + koreaOffset);

  const diff = koreaTime.getTime() - targetTime.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // 초 단위 (60초 미만)
  if (seconds < 60) {
    return `${seconds}초 전`;
  }

  // 분 단위 (60분 미만)
  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  // 시간 단위 (24시간 미만)
  if (hours < 24) {
    return `${hours}시간 전`;
  }

  // 일 단위 (7일 미만)
  if (days < 7) {
    return `${days}일 전`;
  }

  // 7일 이상은 날짜 표시
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * 메시지 시간 포맷팅
 * @param date - 날짜 문자열 또는 Date 객체
 * @returns 포맷된 시간 문자열
 */
export const formatMessageTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();

  if (isToday) {
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return d.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};