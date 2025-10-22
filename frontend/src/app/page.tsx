'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background)] dark:bg-[var(--background)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-[var(--background)] dark:bg-[var(--background)] border-b border-gray-200 dark:border-gray-700 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-10 h-10"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="2"
                y="2"
                width="36"
                height="36"
                rx="8"
                className="stroke-purple-600 dark:stroke-purple-400"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M10 14H30M10 20H25M10 26H28"
                className="stroke-pink-600 dark:stroke-pink-400"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="32"
                cy="32"
                r="4"
                className="fill-purple-600 dark:fill-purple-400"
              />
            </svg>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Board
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                          onError={(e) => {
                            // 이미지 로드 실패 시 기본 아바타로 변경
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9InVybCgjcGFpbnQwX2xpbmVhcl8xXzIpIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiPicgKyB1c2VyLnVzZXJuYW1lPy5bMF0/LnRvVXBwZXJDYXNlKCkgKyAnPC90ZXh0Pgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzFfMiIgeDE9IjAiIHkxPSIwIiB4Mj0iMzIiIHkyPSIzMiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBzdG9wLWNvbG9yPSIjQzA4NEZDIi8+CjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0VDOEZGQyIvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+Cjwvc3ZnPg==';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.username}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium transition-colors"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-semibold transition-all"
                    >
                      회원가입
                    </Link>
                  </>
                )}
              </>
            )}
            <Link
              href="/posts"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
            >
              시작
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Share Your Story
          </h2>

          <Link
            href="/posts"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-semibold hover:shadow-2xl transition-all transform hover:scale-105"
          >
            시작하기
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Features Grid - 3x2 Layout */}
      <div className="py-16 px-4 bg-[var(--surface)] dark:bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              기능소개 
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: 게시글 작성 */}
            <div className="bg-[var(--background)] dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                기본 기능
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                게시물 & 프로필 CRUD & 댓글 & 페이지네이션 
              </p>
            </div>

            {/* Feature 2: 실시간 채팅 */}
            <div className="bg-[var(--background)] dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-pink-600 dark:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Direct Message
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                실시간 1:1 채팅 & 입력 상태 & 읽지 않은 메세지 수 & 읽음 표시 제공 
              </p>
            </div>

            {/* Feature 3: 스토리 */}
            <div className="bg-[var(--background)] dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                팔로우 기반 24시간 스토리
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                스토리 업로드 & 조회 시 윤곽으로 구분, 키보드 내비게이션 제공
              </p>
            </div>

            {/* Feature 4: 팔로우 시스템 */}
            <div className="bg-[var(--background)] dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                팔로우 시스템
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                관심있는 사용자를 팔로우 하여 맞춤형 피드와 스토리 조회
              </p>
            </div>

            {/* Feature 5: 고도화  */}
            <div className="bg-[var(--background)] dark:bg-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                고도화
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                다크모드 지원, 무한 스크롤, Scroll Reveal 애니메이션
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Section with Scroll Animation */}
      <div className="py-20 px-4 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              기술 스택 & 아키텍처
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              최신 기술과 검증된 아키텍처로 구축된 강력한 플랫폼
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Frontend Stack */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 dark:opacity-40"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Frontend</h3>
                </div>

                <div className="space-y-4">
                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Next.js 15</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">App Router</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      최신 React 서버 컴포넌트와 스트리밍 SSR로 빠른 초기 로딩
                    </p>
                  </div>

                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">React 19</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">최신 버전</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Concurrent 기능과 자동 배칭으로 향상된 사용자 경험
                    </p>
                  </div>

                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">TypeScript</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">타입 안정성</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      컴파일 타임 오류 감지로 안정적인 코드 베이스 유지
                    </p>
                  </div>

                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Tailwind CSS</span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">Utility-First</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      빠른 UI 개발과 일관된 디자인 시스템 구축
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backend Stack */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-3xl blur opacity-25 dark:opacity-40"></div>
              <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Backend</h3>
                </div>

                <div className="space-y-4">
                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">NestJS 11</span>
                      <span className="text-sm text-pink-600 dark:text-pink-400">Enterprise</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      엔터프라이즈급 Node.js 프레임워크로 확장 가능한 아키텍처
                    </p>
                  </div>

                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">PostgreSQL 16</span>
                      <span className="text-sm text-pink-600 dark:text-pink-400">RDBMS</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ACID 준수 관계형 DB로 데이터 무결성 보장
                    </p>
                  </div>

                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">Redis</span>
                      <span className="text-sm text-pink-600 dark:text-pink-400">캐싱</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      인메모리 캐싱으로 API 응답 속도 최적화
                    </p>
                  </div>

                  <div className="group hover:scale-105 transition-transform">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">MongoDB</span>
                      <span className="text-sm text-pink-600 dark:text-pink-400">NoSQL</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      채팅 메시지와 로그 데이터의 유연한 저장
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure & Tools */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              인프라 & 도구
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🐳</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Docker</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">컨테이너화</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🔄</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">RabbitMQ</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">메시지 큐</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🔐</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">JWT Auth</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">인증 시스템</p>
              </div>

              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">WebSocket</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">실시간 통신</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[var(--surface)] dark:bg-[var(--surface)] border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Made with ❤️ by Seungheon Lee
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            크래프톤 정글 10기 프로젝트
          </p>
        </div>
      </footer>
    </div>
  );
}