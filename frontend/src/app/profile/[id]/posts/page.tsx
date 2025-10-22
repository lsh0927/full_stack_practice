'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import ScrollAnimation from '@/components/ScrollAnimation';
import { formatDate } from '@/lib/utils';

interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
  views?: number;
  likesCount?: number;
}

interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UserPostsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchData() {
      try {
        const [postsData, userData] = await Promise.all([
          usersApi.getUserPosts(id as string, currentPage, 10),
          usersApi.getUser(id as string),
        ]);
        setPosts(postsData.posts);
        setTotal(postsData.total);
        setTotalPages(postsData.totalPages);
        setProfileUser(userData);
        setLoading(false);
      } catch (err) {
        setError('게시글 목록을 불러오는 중 오류가 발생했습니다');
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id, token, router, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Link href={`/profile/${id}`} className="text-purple-600 dark:text-purple-400 hover:underline">
              프로필로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ScrollAnimation animation="fadeIn" delay={0.1}>
          <div className="mb-6">
            <Link
              href={`/profile/${id}`}
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              프로필로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {profileUser?.username}님의 게시글
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">전체 {total}개</p>
          </div>
        </ScrollAnimation>

        {/* Posts List */}
        {posts.length === 0 ? (
          <ScrollAnimation animation="fadeIn" delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">작성한 게시글이 없습니다</p>
            </div>
          </ScrollAnimation>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <ScrollAnimation key={post.id} animation="slideUp" delay={0.05 * index}>
                <Link href={`/posts/${post.id}`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 p-6 hover:border-purple-400 dark:hover:border-purple-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 mb-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 line-clamp-2 mb-4">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{formatDate(post.createdAt)}</span>
                          {post.views !== undefined && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {post.views}
                            </span>
                          )}
                          {post.likesCount !== undefined && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                              {post.likesCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
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
                );
              })}
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
      </div>
    </div>
  );
}
