export interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
}

export interface Post {
  id: string; // TypeORM은 id 사용 (MongoDB의 _id 대신)
  title: string;
  content: string;
  author: User; // TypeORM은 author 객체 반환
  authorId: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

/*
백엔드에서 받아올 게시글 데이터의 구조 정의
TypeORM + PostgreSQL 사용
*/ 
