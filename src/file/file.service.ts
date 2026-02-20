import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private minioClient: MinioClient | null = null;
  private readonly bucketName: string = 'lightpoles';
  private readonly minioEndpoint: string;
  private readonly minioPort: number;
  private readonly useSSL: boolean;
  private readonly minioEnabled: boolean;
  private minioReady = false;
  private minioInitPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {
    // MinIO configuration
    this.minioEnabled = this.configService.get<string>('MINIO_ENABLED', 'true') === 'true';
    this.minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    this.minioPort = parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10);
    this.useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';

    if (!this.minioEnabled) {
      this.logger.warn('MinIO integration is disabled via MINIO_ENABLED=false');
      return;
    }

    // Initialize MinIO client
    this.minioClient = new MinioClient({
      endPoint: this.minioEndpoint,
      port: this.minioPort,
      useSSL: this.useSSL,
      accessKey: '93WKK0YPWPH23MMN6FON',
      secretKey: 'AASXnjGFzUblLzzdA3fUePQUNNxzfoCwXo+CgaIP',
    });

    // Initialize bucket in the background. API startup should not depend on MinIO availability.
    void this.initializeMinio();
  }

  /**
   * Ensure bucket exists and mark MinIO readiness.
   */
  private async initializeMinio(): Promise<void> {
    if (!this.minioClient) {
      return;
    }
    if (this.minioInitPromise) {
      return this.minioInitPromise;
    }

    this.minioInitPromise = (async () => {
      try {
        const exists = await this.minioClient!.bucketExists(this.bucketName);
        if (!exists) {
          await this.minioClient!.makeBucket(this.bucketName, 'us-east-1');
          this.logger.log(`Bucket "${this.bucketName}" created successfully`);
        } else {
          this.logger.log(`Bucket "${this.bucketName}" already exists`);
        }
        this.minioReady = true;
      } catch (error) {
        this.minioReady = false;
        this.logger.warn(
          `MinIO unavailable. File endpoints will be disabled until MinIO is reachable: ${error.message}`,
        );
      } finally {
        this.minioInitPromise = null;
      }
    })();

    return this.minioInitPromise;
  }

  private async getMinioClientOrThrow(): Promise<MinioClient> {
    if (!this.minioEnabled) {
      throw new ServiceUnavailableException('File storage is disabled (MINIO_ENABLED=false)');
    }
    if (!this.minioClient) {
      throw new ServiceUnavailableException('File storage client is not configured');
    }
    if (!this.minioReady) {
      await this.initializeMinio();
    }
    if (!this.minioReady) {
      throw new ServiceUnavailableException('File storage is unavailable. Ensure MinIO is running.');
    }

    return this.minioClient;
  }

  /**
   * Ensure the bucket exists, create it if it doesn't
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      const client = await this.getMinioClientOrThrow();
      const exists = await client.bucketExists(this.bucketName);
      if (!exists) {
        await client.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`Bucket "${this.bucketName}" created successfully`);
      } else {
        this.logger.log(`Bucket "${this.bucketName}" already exists`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket exists: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to initialize MinIO bucket');
    }
  }

  /**
   * Upload a file to MinIO
   * @param file Express.Multer.File object
   * @param folder Optional folder path within the bucket
   * @returns Object containing file URL and metadata
   */
  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<{ url: string; fileName: string; originalName: string; size: number; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const client = await this.getMinioClientOrThrow();

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.originalname.split('.').pop();
      const fileName = `${timestamp}-${randomString}.${extension}`;
      
      // Construct object name with optional folder
      const objectName = folder ? `${folder}/${fileName}` : fileName;

      // Upload file to MinIO
      await client.putObject(
        this.bucketName,
        objectName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      // Construct file URL (MinIO format: http://endpoint:port/bucket/object)
      const protocol = this.useSSL ? 'https' : 'http';
      const url = `${protocol}://${this.minioEndpoint}${this.minioPort !== 80 && this.minioPort !== 443 ? `:${this.minioPort}` : ''}/${this.bucketName}/${objectName}`;

      this.logger.log(`File uploaded successfully: ${objectName}`);

      return {
        url,
        fileName: objectName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to MinIO
   * @param files Array of Express.Multer.File objects
   * @param folder Optional folder path within the bucket
   * @returns Array of file URLs and metadata
   */
  async uploadFiles(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<Array<{ url: string; fileName: string; originalName: string; size: number; mimeType: string }>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from MinIO
   * @param fileName File name (with folder path if applicable)
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const client = await this.getMinioClientOrThrow();
      await client.removeObject(this.bucketName, fileName);
      this.logger.log(`File deleted successfully: ${fileName}`);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Get file from MinIO as a stream
   * @param fileName File name (with folder path if applicable)
   * @returns Stream of file data
   */
  async getFile(fileName: string): Promise<NodeJS.ReadableStream> {
    try {
      const client = await this.getMinioClientOrThrow();
      const stream = await client.getObject(this.bucketName, fileName);
      return stream;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Error getting file: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get file: ${error.message}`);
    }
  }

  /**
   * Get presigned URL for temporary file access
   * @param fileName File name (with folder path if applicable)
   * @param expiry Expiry time in seconds (default: 7 days)
   * @returns Presigned URL
   */
  async getPresignedUrl(fileName: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      const client = await this.getMinioClientOrThrow();
      const url = await client.presignedGetObject(this.bucketName, fileName, expiry);
      return url;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error(`Error generating presigned URL: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  /**
   * Check if file exists in MinIO
   * @param fileName File name (with folder path if applicable)
   * @returns Boolean indicating if file exists
   */
  async fileExists(fileName: string): Promise<boolean> {
    try {
      const client = await this.getMinioClientOrThrow();
      await client.statObject(this.bucketName, fileName);
      return true;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }
}

