import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PublicToiletStatus } from '../entities/public-toilet.entity';

export class CreatePublicToiletDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  district: string;

  @ApiProperty()
  @IsString()
  street: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  gpsLng?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  toiletType?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  hasPaidAccess?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  accessFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: PublicToiletStatus, default: PublicToiletStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PublicToiletStatus)
  status?: PublicToiletStatus;
}


