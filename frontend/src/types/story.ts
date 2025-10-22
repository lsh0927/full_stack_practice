export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl: string | null;
  authorId: string;
  author: {
    id: string;
    username: string;
    profileImage: string | null;
  };
  expiresAt: string;
  viewsCount: number;
  isViewed: boolean;
  createdAt: string;
}

export interface CreateStoryDto {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
}

export interface StoriesByAuthor {
  [authorId: string]: Story[];
}
