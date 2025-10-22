export class StoryResponseDto {
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
  expiresAt: Date;
  viewsCount: number;
  isViewed: boolean; // 현재 사용자가 봤는지 여부
  createdAt: Date;
}
