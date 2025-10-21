'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi, API_URL } from '@/lib/api';

export default function NewPostPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title || !formData.content) {
      setError('모든 필드를 입력해주세요');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('로그인이 필요합니다');
      setLoading(false);
      return;
    }

    try {
      // JWT 토큰을 Authorization 헤더에 담아서 전송
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // NestJS JwtAuthGuard가 이 헤더를 확인
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('인증이 필요합니다. 다시 로그인해주세요.');
        }
        throw new Error('게시글 작성에 실패했습니다');
      }

      const newPost = await response.json();
      router.push(`/posts/${newPost.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 작성 중 오류가 발생했습니다');
      setLoading(false);
    }
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Board
          </Link>
          <Link
            href="/posts"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-full font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            취소
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">새 게시글 작성</h1>
          <p className="text-gray-600 dark:text-gray-300">당신의 이야기를 공유해보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          {/* 로그인된 사용자 정보 표시 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-purple-100 dark:ring-purple-800">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{user.username}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="제목을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              내용
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="내용을 입력하세요"
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/posts"
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
