'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/post';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
}

export default function PostsPage() {
  const router = useRouter();
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 로그인 체크
  useEffect(() => {
    // AuthContext가 아직 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 로딩이 끝났는데 user나 token이 없으면 로그인 페이지로
    if (!user || !token) {
      router.push('/auth/login');
    }
  }, [user, token, router, authLoading]);

  useEffect(() => {
    async function fetchPosts() {
      // 토큰이 없으면 fetch하지 않음
      if (!token) {
        console.log('Token not available yet, skipping fetch');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        console.log('Fetching posts with token:', token);
        const response = await fetch(`${API_URL}/posts?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('Posts fetch failed:', response.status, response.statusText);
          throw new Error('게시글을 불러오는데 실패했습니다');
        }

        const data: PostsResponse = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('게시글을 불러오는 중 오류가 발생했습니다');
        setLoading(false);
      }
    }

    fetchPosts();
  }, [currentPage, searchQuery, token]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // AuthContext가 아직 로딩 중이거나 posts가 로딩 중일 때
  if (authLoading || (loading && !error)) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/"
              className="text-purple-600 hover:underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="검색..."
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>

        {/* New Post Button */}
        <div className="mb-6 flex justify-end">
          <Link
            href="/posts/new"
            className="px-6 py-2 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-all"
          >
            작성
          </Link>
        </div>
        {/* Search Info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-600">
              &apos;<span className="font-semibold text-gray-900">{searchQuery}</span>&apos; 검색 결과: {total}개
            </p>
            <button
              onClick={handleClearSearch}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              초기화
            </button>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mb-4">게시글이 없습니다</p>
            <Link
              href="/posts/new"
              className="inline-block px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              첫 게시글 작성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center mb-3">
                    <Link
                      href={`/profile/${post.author?.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center hover:opacity-80 transition-opacity"
                    >
                      {post.author?.profileImage ? (
                        <img
                          src={`${API_URL}${post.author.profileImage}`}
                          alt={post.author.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ display: post.author?.profileImage ? 'none' : 'flex' }}
                      >
                        {post.author?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900 hover:text-purple-600">
                          {post.author?.username || '알 수 없음'}
                        </p>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Post Content */}
                  <Link href={`/posts/${post.id}`}>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-purple-600 cursor-pointer">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 line-clamp-2 mb-4">
                      {post.content}
                    </p>

                    {/* Post Footer */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'hover:bg-white text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Total Count */}
        <div className="mt-8 text-center text-sm text-gray-500">
          전체 {total}개의 게시글
        </div>
      </div>
    </div>
  );
}
