'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/post';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import ScrollAnimation from '@/components/ScrollAnimation';
import ProfileImage from '@/components/ProfileImage';

interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
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
        console.log('Fetching posts with token:', token);
        const data: PostsResponse = await postsApi.getPosts({
          page: currentPage,
          limit: 10,
          search: searchQuery || undefined,
        });

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link
              href="/"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <ScrollAnimation animation="fadeIn" delay={0.1}>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="검색..."
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </ScrollAnimation>

        {/* New Post Button */}
        <ScrollAnimation animation="slideLeft" delay={0.2}>
          <div className="mb-6 flex justify-end">
            <Link
              href="/posts/new"
              className="px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              작성
            </Link>
          </div>
        </ScrollAnimation>
        {/* Search Info */}
        {searchQuery && (
          <div className="mb-6 flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300">
              &apos;<span className="font-semibold text-gray-900 dark:text-gray-100">{searchQuery}</span>&apos; 검색 결과: {total}개
            </p>
            <button
              onClick={handleClearSearch}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
            >
              초기화
            </button>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-4">게시글이 없습니다</p>
            <Link
              href="/posts/new"
              className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105"
            >
              첫 게시글 작성하기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <ScrollAnimation
                key={post.id}
                animation="slideUp"
                delay={0.1 * (index % 5)}
              >
                <div className="block bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700">
                  <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center mb-3">
                    <Link
                      href={`/profile/${post.author?.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center hover:opacity-80 transition-opacity"
                    >
                      <ProfileImage
                        profileImage={post.author?.profileImage}
                        username={post.author?.username}
                        size="md"
                      />
                      <div className="ml-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400">
                          {post.author?.username || '알 수 없음'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(post.createdAt)}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Post Content */}
                  <Link href={`/posts/${post.id}`}>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 hover:text-purple-600 dark:hover:text-purple-400 cursor-pointer">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                      {post.content}
                    </p>

                    {/* Post Footer */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{post.likesCount || 0}</span>
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
              </ScrollAnimation>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-white shadow-lg'
                      : 'hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Total Count */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          전체 {total}개의 게시글
        </div>
      </div>
    </div>
  );
}
