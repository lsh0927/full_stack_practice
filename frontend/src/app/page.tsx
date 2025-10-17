import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* 메인 헤더 영역 */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            게시판 프로젝트
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            React, Next.js, NestJS, MongoDB를 활용한 풀스택 애플리케이션
          </p>
          <p className="text-lg text-gray-600">
            게시글을 자유롭게 작성하고 관리할 수 있는 플랫폼입니다
          </p>
        </div>

        {/* 주요 기능 카드 영역 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* 기능 1: 게시글 작성 */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
            <div className="text-4xl mb-4">✍️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              게시글 작성
            </h3>
            <p className="text-gray-600">
              누구나 쉽게 게시글을 작성하고 자신의 생각을 공유할 수 있습니다
            </p>
          </div>

          {/* 기능 2: 실시간 조회 */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
            <div className="text-4xl mb-4">👀</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              실시간 조회
            </h3>
            <p className="text-gray-600">
              모든 게시글을 실시간으로 확인하고 조회수가 자동으로 집계됩니다
            </p>
          </div>

          {/* 기능 3: 수정 및 삭제 */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              수정 및 삭제
            </h3>
            <p className="text-gray-600">
              작성한 게시글을 언제든지 수정하거나 삭제할 수 있습니다
            </p>
          </div>
        </div>

        {/* 기술 스택 소개 영역 */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            사용된 기술 스택
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* 프론트엔드 */}
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">
                Frontend
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• React 19 - 사용자 인터페이스 구축</p>
                <p>• Next.js 15 - 서버 사이드 렌더링 프레임워크</p>
                <p>• TypeScript - 타입 안정성 보장</p>
                <p>• Tailwind CSS - 반응형 디자인</p>
              </div>
            </div>

            {/* 백엔드 */}
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-3">
                Backend
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• NestJS - 확장 가능한 서버 프레임워크</p>
                <p>• MongoDB - NoSQL 데이터베이스</p>
                <p>• Mongoose - MongoDB ODM</p>
                <p>• Docker - 컨테이너 기반 개발 환경</p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 액션 버튼 */}
        <div className="text-center">
          <Link
            href="/posts"
            className="inline-block bg-blue-600 text-white text-xl font-semibold px-12 py-4 rounded-lg shadow-lg hover:bg-blue-700 transform transition-all hover:scale-105"
          >
            게시판 바로가기 →
          </Link>
          <p className="mt-4 text-gray-600">
            지금 바로 게시글을 확인하고 작성해보세요
          </p>
        </div>
      </div>
    </div>
  );
}