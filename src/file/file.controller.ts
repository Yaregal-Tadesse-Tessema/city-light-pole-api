import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileService } from './file.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file to MinIO' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional folder path within the bucket',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    return this.fileService.uploadFile(file, folder);
  }

  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files to MinIO' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          description: 'Optional folder path within the bucket',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.fileService.uploadFiles(files, folder);
  }

  @Get(':fileName')
  @ApiOperation({ summary: 'Get file from MinIO' })
  @ApiParam({ name: 'fileName', description: 'File name (with folder path if applicable)' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(@Param('fileName') fileName: string) {
    const stream = await this.fileService.getFile(fileName);
    return stream;
  }

  @Get(':fileName/presigned-url')
  @ApiOperation({ summary: 'Get presigned URL for temporary file access' })
  @ApiParam({ name: 'fileName', description: 'File name (with folder path if applicable)' })
  @ApiQuery({ name: 'expiry', required: false, type: Number, description: 'Expiry time in seconds (default: 7 days)' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPresignedUrl(
    @Param('fileName') fileName: string,
    @Query('expiry') expiry?: number,
  ) {
    return {
      url: await this.fileService.getPresignedUrl(fileName, expiry),
    };
  }

  @Delete(':fileName')
  @ApiOperation({ summary: 'Delete file from MinIO' })
  @ApiParam({ name: 'fileName', description: 'File name (with folder path if applicable)' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(@Param('fileName') fileName: string) {
    await this.fileService.deleteFile(fileName);
    return { message: 'File deleted successfully', fileName };
  }

  @Get(':fileName/exists')
  @ApiOperation({ summary: 'Check if file exists in MinIO' })
  @ApiParam({ name: 'fileName', description: 'File name (with folder path if applicable)' })
  @ApiResponse({ status: 200, description: 'File existence checked' })
  async fileExists(@Param('fileName') fileName: string) {
    const exists = await this.fileService.fileExists(fileName);
    return { exists, fileName };
  }
}

