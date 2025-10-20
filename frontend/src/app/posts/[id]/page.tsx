'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/post';
import { useAuth } from '@/contexts/AuthContext';
import CommentSection from '@/components/CommentSection';

const API_URL = 'http://localhost:3000';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, token } = useAuth(); // user 추가
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const viewCountedRef = useRef(false);

  // 로그인 체크
  useEffect(() => {
    if (!user || !token) {
      router.push('/auth/login');
    }
  }, [user, token, router]);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`${API_URL}/posts/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
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

        const data = await response.json();
        setPost(data);
        setLoading(false);

        if (!viewCountedRef.current) {
          viewCountedRef.current = true;
          fetch(`${API_URL}/posts/${id}/views`, {
            method: 'POST',
          }).catch(() => {});
        }
      } catch (err) {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }

    fetchPost();
  }, [id, token]);

  const handleDelete = async () => {
    // 권한 검증: 본인의 게시물이 아닌 경우
    if (post && user && post.author && post.author.id !== user.id) {
      alert('접근 권한이 없습니다');
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      alert('게시글이 삭제되었습니다.');
      router.push('/posts');
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBlockUser = async () => {
    if (!token || !post?.author?.id) return;

    const confirmed = window.confirm(
      `정말로 ${post.author.username}님을 차단하시겠습니까?\n\n차단하면:\n- 이 사용자의 게시글과 댓글이 보이지 않습니다.\n- 이 사용자도 회원님의 게시글과 댓글을 볼 수 없습니다.`
    );

    if (!confirmed) return;

    setIsBlocking(true);

    try {
      const response = await fetch(`${API_URL}/blocks/${post.author.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '차단에 실패했습니다');
      }

      alert('사용자를 차단했습니다.');
      router.push('/posts'); // 게시글 목록으로 이동
    } catch (err: any) {
      alert(err.message || '차단 중 오류가 발생했습니다');
      setIsBlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
            <Link
              href="/posts"
              className="text-purple-600 hover:underline"
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Board
          </Link>
          <Link
            href="/posts"
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
          >
            목록
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Post Card */}
        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Post Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center mb-4">
              {post.author?.profileImage ? (
                <img
                  src={`${API_URL}${post.author.profileImage}`}
                  alt={post.author.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {post.author?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="ml-3 flex-1">
                <p className="font-semibold text-gray-900">{post.author?.username || '알 수 없음'}</p>
                <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{post.views}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {post.title}
            </h1>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
              {post.content}
            </div>
          </div>

          {/* Post Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            {/* 본인의 게시글일 때만 수정/삭제 버튼 표시 */}
            {user && post.author && post.author.id === user.id ? (
              <div className="flex gap-3 justify-end">
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-full font-medium hover:bg-red-100 transition-colors"
                >
                  삭제
                </button>
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleBlockUser}
                  disabled={isBlocking}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBlocking ? '차단 중...' : '사용자 차단'}
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Comment Section */}
        <CommentSection postId={id} />

        {/* Back to List */}
        <div className="mt-6 text-center">
          <Link
            href="/posts"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
