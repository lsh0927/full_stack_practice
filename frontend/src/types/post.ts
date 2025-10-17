export interface Post {
  _id: string;
  title: string;
  content: string;
  author: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

/* 
백엔드에서 받아올 게시글 데이터의 구조 정의 
MongoDB는 자동으로 _id필드를 생성
*/ 
