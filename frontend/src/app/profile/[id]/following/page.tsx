'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { followsApi, usersApi } from '@/lib/api';
import FollowButton from '@/components/FollowButton';
import ScrollAnimation from '@/components/ScrollAnimation';
import ProfileImage from '@/components/ProfileImage';

interface FollowUser {
  id: string;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
}

interface FollowingResponse {
  data: FollowUser[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FollowingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [following, setFollowing] = useState<FollowUser[]>([]);
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
        const [followingData, userData] = await Promise.all([
          followsApi.getFollowing(id as string, currentPage, 20),
          usersApi.getUser(id as string),
        ]);
        setFollowing(followingData.data);
        setTotal(followingData.total);
        setTotalPages(followingData.totalPages);
        setProfileUser(userData);
        setLoading(false);
      } catch (err) {
        setError('팔로잉 목록을 불러오는 중 오류가 발생했습니다');
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
              {profileUser?.username}님이 팔로우하는 사용자
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">전체 {total}명</p>
          </div>
        </ScrollAnimation>

        {/* Following List */}
        {following.length === 0 ? (
          <ScrollAnimation animation="fadeIn" delay={0.2}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">팔로우하는 사용자가 없습니다</p>
            </div>
          </ScrollAnimation>
        ) : (
          <div className="space-y-4">
            {following.map((followedUser, index) => (
              <ScrollAnimation key={followedUser.id} animation="slideUp" delay={0.05 * index}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/profile/${followedUser.id}`}
                      className="flex items-center gap-4 hover:opacity-80 transition-opacity flex-1"
                    >
                      <ProfileImage
                        profileImage={followedUser.profileImage}
                        username={followedUser.username}
                        size="lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400">
                          {followedUser.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{followedUser.email}</p>
                        {followedUser.bio && (
                          <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2">
                            {followedUser.bio}
                          </p>
                        )}
                      </div>
                    </Link>
                    {user?.id !== followedUser.id && (
                      <FollowButton userId={followedUser.id} />
                    )}
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
