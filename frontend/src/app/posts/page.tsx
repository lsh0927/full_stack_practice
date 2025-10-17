'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Post } from '@/types/post';

const API_URL = 'http://localhost:3000';

// 백엔드 API 응답의 타입을 정의합니다
// 이제는 단순한 배열이 아니라 페이지네이션 정보를 포함한 객체입니다
interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostsPage() {
  // 게시글 목록과 페이지네이션 정보를 상태로 관리합니다
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // 검색어를 상태로 관리합니다
  // searchInput은 입력 필드에 표시되는 값이고
  // searchQuery는 실제로 API에 전달되는 검색어입니다
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 로딩과 에러 상태도 관리합니다
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 페이지나 검색어가 변경될 때마다 데이터를 다시 불러옵니다
  // useEffect의 의존성 배열에 currentPage와 searchQuery를 넣어서
  // 이 값들이 바뀔 때마다 자동으로 실행되도록 합니다
  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      setError('');

      try {
        // 쿼리 파라미터를 만듭니다
        // searchQuery가 있으면 search 파라미터를 추가합니다
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`${API_URL}/posts?${params}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다');
        }

        // 이제 응답은 배열이 아니라 객체입니다
        // posts, total, page, totalPages를 모두 추출합니다
        const data: PostsResponse = await response.json();
        setPosts(data.posts);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setLoading(false);
      } catch (err) {
        setError('게시글을 불러오는 중 오류가 발생했습니다');
        setLoading(false);
      }
    }

    fetchPosts();
  }, [currentPage, searchQuery]);

  // 검색 버튼을 클릭하면 실행되는 함수입니다
  // searchInput의 값을 searchQuery에 설정하면
  // useEffect가 자동으로 실행되어 새로운 검색 결과를 불러옵니다
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // 검색할 때는 항상 1페이지로 돌아갑니다
  };

  // 검색을 초기화하는 함수입니다
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // 페이지 번호를 클릭하면 실행되는 함수입니다
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지를 변경하면 스크롤을 맨 위로 올립니다
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 로딩 중일 때 표시할 화면입니다
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러가 발생했을 때 표시할 화면입니다
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 영역: 제목과 글쓰기 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">게시판</h1>
          <Link
            href="/"
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            홈으로
          </Link>
          <Link
            href="/posts/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            글쓰기
          </Link>
        </div>

        {/* 검색 영역 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="제목이나 내용으로 검색하세요"
              className="flex-1 px-4 py-2 text-black font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              검색
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                초기화
              </button>
            )}
          </form>
          {/* 검색 결과 정보 표시 */}
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              "{searchQuery}" 검색 결과: {total}개
            </p>
          )}
        </div>

        {/* 게시글이 없을 때 */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? '검색 결과가 없습니다.'
                : '작성된 게시글이 없습니다.'}
            </p>
          </div>
        ) : (
          <>
            {/* 게시글 목록 테이블 */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      작성자
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      조회수
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      작성일
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr
                      key={post._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/posts/${post._id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {post.author}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {post.views}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 버튼 영역 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                {/* 이전 페이지 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-black border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>

                {/* 페이지 번호 버튼들 */}
                {/* 전체 페이지 수만큼 버튼을 생성합니다 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-black border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                {/* 다음 페이지 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-black border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}