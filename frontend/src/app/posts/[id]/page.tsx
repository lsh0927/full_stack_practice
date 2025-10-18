'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/post';

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
  params: { id: string };
}) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const viewCountedRef = useRef(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const response = await fetch(`${API_URL}/posts/${params.id}`, {
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

        // 조회수 증가는 한 번만 호출
        if (!viewCountedRef.current) {
          viewCountedRef.current = true;
          fetch(`${API_URL}/posts/${params.id}/views`, {
            method: 'POST',
          }).catch(() => {
            // 조회수 증가 실패는 무시 (사용자 경험에 영향 없음)
          });
        }
      } catch (err) {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    }

    fetchPost();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/posts/${params.id}`, {
        method: 'DELETE',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/posts"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← 목록으로
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-red-600 text-lg">{error || '게시글을 찾을 수 없습니다.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href="/posts"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← 목록으로
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b bg-gray-50 px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {post.title}
            </h1>
            <div className="flex items-center text-sm text-gray-600 gap-4">
              <span className="font-medium">{post.author}</span>
              <span>•</span>
              <span>{formatDate(post.createdAt)}</span>
              <span>•</span>
              <span>조회 {post.views}</span>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          <div className="border-t bg-gray-50 px-8 py-4 flex justify-between">
            <Link
              href="/posts"
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              목록
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/posts/${post._id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}