export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    profileImage?: string;
  };
  postId: string;
  parentId?: string;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}

export interface UpdateCommentDto {
  content: string;
}
