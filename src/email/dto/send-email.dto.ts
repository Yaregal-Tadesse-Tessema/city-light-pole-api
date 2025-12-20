import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EmailAttachmentDto {
  @ApiProperty({ example: 'base64encodedcontent', description: 'Base64 encoded file content' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'document.pdf', description: 'Filename' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
  @IsString()
  type: string;
}

export class SendEmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'Recipient email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', required: false, description: 'Recipient name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Test Email Subject', description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ example: '<h1>Hello World</h1><p>This is a test email.</p>', description: 'Email body in HTML' })
  @IsString()
  body: string;

  @ApiProperty({ type: [EmailAttachmentDto], required: false, description: 'Email attachments' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailAttachmentDto)
  attachments?: EmailAttachmentDto[];
}

