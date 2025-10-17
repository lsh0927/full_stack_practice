'use client';

// React의 useState 훅을 가져옴. 컴포넌트 안에서 데이터를 관리하는 도구.
// useRouter는 페이지 이동을 위한 Next.js 훅
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 백엔드 API 주소
const API_URL = 'http://localhost:3000';

export default function NewPostPage() {
  // useRouter 훅을 사용해서 페이지 이동 기능을 가져옴
  // 게시글 작성이 완료되면 목록 페이지로 이동시킬 때 사용
  const router = useRouter();
  
  // useState 훅으로 폼의 각 입력 필드의 상태를 관리.
  // 배열의 첫 번째 값은 현재 상태이고, 두 번째 값은 상태를 변경하는 함수
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  
  // 폼 제출 중인지 여부를 나타내는 상태
  // 제출 중일 때는 버튼을 비활성화해서 중복 제출을 방지
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 에러 메시지를 저장하는 상태
  // 문제가 발생하면 사용자에게 보여줄 메시지를 여기에 담음
  const [error, setError] = useState('');

  // 폼이 제출될 때 실행되는 함수
  const handleSubmit = async (e: React.FormEvent) => {
    // preventDefault()는 폼의 기본 동작(페이지 새로고침)을 막음
    // 없으면 폼을 제출할 때마다 페이지가 새로고침되어 버림.
    e.preventDefault();
    
    // 입력값 검증: 모든 필드가 비어있지 않은지 확인
    if (!title.trim() || !content.trim() || !author.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    // 제출 시작: 버튼을 비활성화하고 에러 메시지를 초기화
    setIsSubmitting(true);
    setError('');

    try {
      // 백엔드 POST /posts API를 호출해서 새 게시글을 생성
      // fetch의 두 번째 인자로 요청 설정을 전달
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST', // HTTP 메서드를 POST로 설정
        headers: {
          'Content-Type': 'application/json', // JSON 형식으로 데이터를 보낸다고 알림
        },
        // body에 실제 전송할 데이터를 JSON 문자열로 변환해서 담음
        body: JSON.stringify({
          title: title.trim(), // trim()으로 앞뒤 공백 제거
          content: content.trim(),
          author: author.trim(),
        }),
      });

      // 응답이 성공적이지 않으면 에러를 던짐
      if (!response.ok) {
        throw new Error('게시글 작성에 실패했습니다.');
      }

      // 성공하면 백엔드가 반환한 게시글 데이터를 받아옴
      const newPost = await response.json();
      
      // 방금 작성한 게시글의 상세 페이지로 이동
      // router.push는 페이지를 이동시키는 함수
      router.push(`/posts/${newPost._id}`);
      
    } catch (err) {
      // 에러가 발생하면 에러 메시지를 상태에 저장
      // 이 메시지는 화면에 표시
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      // 에러가 발생하면 버튼을 다시 활성화해서 재시도할 수 있게 
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link
            href="/posts"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← 목록으로
          </Link>
        </div>

        {/* 게시글 작성 폼 카드 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            새 게시글 작성
          </h1>

          {/* 에러 메시지 표시 영역 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 실제 폼 요소 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 입력 필드 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                // onChange 이벤트로 사용자가 입력할 때마다 상태를 업데이트
                // e.target.value는 input 요소의 현재 값을 의미
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="게시글 제목을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            {/* 작성자 입력 필드 */}
            <div>
              <label
                htmlFor="author"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                작성자
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="작성자 이름을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            {/* 내용 입력 필드 */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                내용
              </label>
              {/* textarea는 여러 줄의 텍스트를 입력받을 수 있는 요소 */}
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="게시글 내용을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-3 justify-end pt-4">
              {/* 취소 버튼 */}
              <Link
                href="/posts"
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </Link>
              
              {/* 제출 버튼 */}
              <button
                type="submit"
                // disabled 속성으로 제출 중일 때 버튼을 비활성화
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {/* 제출 중일 때는 버튼 텍스트를 변경해서 사용자에게 진행 상태를 알려줌 */}
                {isSubmitting ? '작성 중...' : '작성 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}