import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ImageService } from '../services/image.service';
import { MESSAGE_PATTERNS } from '../constants/queue.constants';
import {
  ResizeImageDto,
  OptimizeImageDto,
  CreateThumbnailDto,
} from '../dto/image.dto';

/**
 * ImageConsumer - 이미지 처리 큐 메시지 처리
 *
 * RabbitMQ의 image-queue에서 메시지를 수신하여 처리
 */
@Controller()
export class ImageConsumer {
  private readonly logger = new Logger(ImageConsumer.name);

  constructor(private readonly imageService: ImageService) {}

  /**
   * 이미지 리사이징 처리
   */
  @EventPattern(MESSAGE_PATTERNS.IMAGE_RESIZE)
  async handleResizeImage(
    @Payload() data: ResizeImageDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`🖼️  Received RESIZE image request: ${data.filePath}`);

    try {
      await this.imageService.resizeImage(data);
      this.logger.log(`✅ RESIZE image completed: ${data.outputPath}`);

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to RESIZE image: ${data.filePath}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * 이미지 최적화 처리
   */
  @EventPattern(MESSAGE_PATTERNS.IMAGE_OPTIMIZE)
  async handleOptimizeImage(
    @Payload() data: OptimizeImageDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`🖼️  Received OPTIMIZE image request: ${data.filePath}`);

    try {
      await this.imageService.optimizeImage(data);
      this.logger.log(
        `✅ OPTIMIZE image completed: ${data.outputPath || data.filePath}`,
      );

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to OPTIMIZE image: ${data.filePath}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * 썸네일 생성 처리
   */
  @EventPattern(MESSAGE_PATTERNS.IMAGE_THUMBNAIL)
  async handleCreateThumbnail(
    @Payload() data: CreateThumbnailDto,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`🖼️  Received THUMBNAIL request: ${data.filePath}`);

    try {
      await this.imageService.createThumbnail(data);
      this.logger.log(`✅ THUMBNAIL created: ${data.outputPath}`);

      // 메시지 ACK
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `❌ Failed to create THUMBNAIL: ${data.filePath}`,
        error.stack,
      );

      // 에러 발생 시 NACK (재시도)
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      channel.nack(originalMsg, false, true);
    }
  }
}
