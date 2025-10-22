import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateStoryDto {
  @IsNotEmpty()
  @IsUrl()
  mediaUrl: string;

  @IsEnum(['image', 'video'])
  mediaType: 'image' | 'video';

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}
