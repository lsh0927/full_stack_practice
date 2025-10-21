import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ResizeImageDto,
  OptimizeImageDto,
  CreateThumbnailDto,
} from '../dto/image.dto';

/**
 * ImageService - 이미지 처리 서비스
 *
 * Sharp 라이브러리를 사용한 이미지 리사이징, 최적화, 썸네일 생성
 */
@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  /**
   * 이미지 리사이징
   * - 지정된 크기로 이미지 변환
   * - 비율 유지 옵션 가능
   */
  async resizeImage(data: ResizeImageDto): Promise<void> {
    this.logger.log(`🖼️  Resizing image: ${data.filePath}`);
    this.logger.log(
      `🖼️  Output: ${data.outputPath} (${data.width}x${data.height})`,
    );

    try {
      // 출력 디렉토리 생성
      const outputDir = path.dirname(data.outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Sharp로 이미지 리사이징
      await sharp(data.filePath)
        .resize(data.width, data.height, {
          fit: 'inside', // 비율 유지하면서 크기 맞춤
          withoutEnlargement: true, // 원본보다 크게 확대하지 않음
        })
        .jpeg({ quality: data.quality || 80 })
        .toFile(data.outputPath);

      this.logger.log(`✅ Image resized successfully: ${data.outputPath}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to resize image: ${data.filePath}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 이미지 최적화
   * - 파일 크기 압축
   * - 품질 조정
   */
  async optimizeImage(data: OptimizeImageDto): Promise<void> {
    this.logger.log(`🖼️  Optimizing image: ${data.filePath}`);

    try {
      const outputPath = data.outputPath || data.filePath;

      // 출력 디렉토리 생성
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Sharp로 이미지 최적화
      const metadata = await sharp(data.filePath).metadata();

      if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
        await sharp(data.filePath)
          .jpeg({ quality: data.quality || 80, progressive: true })
          .toFile(outputPath + '.tmp');
      } else if (metadata.format === 'png') {
        await sharp(data.filePath)
          .png({ quality: data.quality || 80, compressionLevel: 9 })
          .toFile(outputPath + '.tmp');
      } else if (metadata.format === 'webp') {
        await sharp(data.filePath)
          .webp({ quality: data.quality || 80 })
          .toFile(outputPath + '.tmp');
      }

      // 임시 파일을 원본으로 교체
      await fs.rename(outputPath + '.tmp', outputPath);

      this.logger.log(`✅ Image optimized successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to optimize image: ${data.filePath}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 썸네일 생성
   * - 작은 크기의 미리보기 이미지 생성
   * - 정사각형 크롭 옵션
   */
  async createThumbnail(data: CreateThumbnailDto): Promise<void> {
    this.logger.log(`🖼️  Creating thumbnail: ${data.filePath}`);
    this.logger.log(`🖼️  Output: ${data.outputPath} (${data.width}x${data.height})`);

    try {
      // 출력 디렉토리 생성
      const outputDir = path.dirname(data.outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Sharp로 썸네일 생성
      await sharp(data.filePath)
        .resize(data.width, data.height, {
          fit: 'cover', // 비율 유지하면서 크롭
          position: 'center', // 중앙 기준 크롭
        })
        .jpeg({ quality: 70 })
        .toFile(data.outputPath);

      this.logger.log(`✅ Thumbnail created successfully: ${data.outputPath}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to create thumbnail: ${data.filePath}`,
        error.stack,
      );
      throw error;
    }
  }
}
