import Link from 'next/link';
import { Post } from '@/types/post';

// 백엔드 API 주소
const API_URL = 'http://localhost:3000';

// 게시글 목록을 가져오는 함수
async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      cache: 'no-store', // 항상 최신 데이터를 가져오도록 캐시 비활성화
    });
    
    if (!response.ok) {
      throw new Error('게시글을 불러오는데 실패했습니다');
    }
    
    return response.json();
  } catch (error) {
    console.error('게시글 조회 오류:', error);
    return [];
  }
}

// 날짜를 보기 좋게 포맷팅하는 함수
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

// 게시글 목록 페이지 컴포넌트
export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">게시판</h1>
          <Link
            href="/posts/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            글쓰기
          </Link>
        </div>

        {/* 게시글이 없을 때 */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">작성된 게시글이 없습니다.</p>
          </div>
        ) : (
          /* 게시글 목록 테이블 */
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
        )}
      </div>
    </div>
  );
}

/*
코드 설명
Next.js의 App Router에서는 컴포넌트가 기본적으로 서버에서 실행
전통적인 react와 다름
PostPage 컴포넌트가 async 함수인 이유는 서버에서 데이터를 가져오는 동안
기다려야 하기 때문에

fetch: js에 내장된 HTTP Client -> cache no-store 옵션을 쓰면
Next.js가 결과를 캐싱하지 않고 항상 최신 데이터를 가져옴 (이득이 뭔지 확인)

화면 구성: 상단에 제목과 글쓰기 버튼 - 하단에 게시글 목록이 테이블 형태로 표시
Tailwind CSS 클래스를 사용해 스타일을 입힘 


*/