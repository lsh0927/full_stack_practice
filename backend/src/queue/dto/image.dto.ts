/**
 * 이미지 처리를 위한 DTO
 */

/**
 * 이미지 리사이징 DTO
 */
export class ResizeImageDto {
  filePath: string; // 원본 이미지 파일 경로
  outputPath: string; // 출력 파일 경로
  width?: number; // 너비 (픽셀)
  height?: number; // 높이 (픽셀)
  quality?: number; // 품질 (1-100)
}

/**
 * 이미지 최적화 DTO
 */
export class OptimizeImageDto {
  filePath: string; // 이미지 파일 경로
  outputPath?: string; // 출력 파일 경로 (없으면 원본 덮어쓰기)
  quality?: number; // 품질 (1-100)
}

/**
 * 썸네일 생성 DTO
 */
export class CreateThumbnailDto {
  filePath: string; // 원본 이미지 파일 경로
  outputPath: string; // 썸네일 파일 경로
  width: number; // 썸네일 너비
  height: number; // 썸네일 높이
}
