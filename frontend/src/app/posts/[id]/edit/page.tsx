'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Post } from '@/types/post';

const API_URL = 'http://localhost:3000';

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // use 훅으로 params Promise를 풀어서 실제 ID 값을 가져옴
  const resolvedParams = use(params);
  const postId = resolvedParams.id;
  
  const router = useRouter();
  
  // 폼의 각 필드를 관리하는 상태들
  // 처음에는 빈 문자열로 시작하고, 데이터를 불러오면 채워짐
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  
  // 데이터 로딩 상태를 나타냄
  // true일 때는 로딩 중 화면을 보여줌
  const [loading, setLoading] = useState(true);
  
  // 폼 제출 중인지 여부를 나타냄
  // 제출 중일 때는 버튼을 비활성화해서 중복 제출을 방지
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 에러 메시지를 저장
  const [error, setError] = useState('');

  // 컴포넌트가 처음 화면에 나타날 때 실행되어 기존 게시글 데이터를 가져옴
  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
          cache: 'no-store',
        });

        if (response.status === 404) {
          setError('게시글을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        // 백엔드에서 받은 게시글 데이터를 각 상태에 설정
        // 이렇게 하면 폼의 입력 필드에 기존 데이터가 채워짐
        const data: Post = await response.json();
        setTitle(data.title);
        setContent(data.content);
        setAuthor(data.author);
        setLoading(false);
      } catch (err) {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }

    fetchPost();
  }, [postId]);

  // 폼이 제출될 때 실행되는 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증: 모든 필드가 비어있지 않은지 확인
    if (!title.trim() || !content.trim() || !author.trim()) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      // 백엔드의 PATCH API를 호출해서 게시글을 수정
      // POST가 아닌 PATCH를 사용하는 이유는, 전체를 교체하는 것이 아니라
      // 일부 필드만 수정하는 것이기 때문
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          author: author.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('게시글 수정에 실패했습니다.');
      }

      // 수정이 성공하면 해당 게시글의 상세 페이지로 이동
      // 사용자는 자신이 수정한 내용을 바로 확인할 수 있음
      router.push(`/posts/${postId}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  // 데이터를 불러오는 중일 때 표시할 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 오류가 발생했을 때 표시할 화면
  if (error && !title) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/posts"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← 목록으로
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/posts/${postId}`}
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← 게시글로 돌아가기
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            게시글 수정
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="게시글 제목을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

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

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full text-gray-900 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                placeholder="게시글 내용을 입력하세요"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Link
                href={`/posts/${postId}`}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}