'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh_token');
      const provider = searchParams.get('provider');
      const errorParam = searchParams.get('error');

      // 에러가 있는 경우
      if (errorParam) {
        setError('로그인에 실패했습니다.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
        return;
      }

      // 토큰이 없는 경우
      if (!token) {
        setError('인증 정보를 찾을 수 없습니다.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
        return;
      }

      try {
        // 토큰 저장 (AuthContext가 사용하는 키 이름으로)
        localStorage.setItem('token', token);

        // 리프레시 토큰도 저장
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        // AuthContext에서 사용자 정보를 자동으로 가져오도록
        // 페이지 새로고침으로 AuthContext가 토큰을 읽고 사용자 정보를 가져옴
        window.location.href = '/posts';
      } catch (err) {
        console.error('OAuth 콜백 처리 실패:', err);
        setError('로그인 처리 중 오류가 발생했습니다.');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center max-w-md w-full">
        {error ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인 실패</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-purple-600 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">로그인 처리 중</h2>
            <p className="text-gray-600">잠시만 기다려주세요...</p>
          </>
        )}
      </div>
    </div>
  );
}