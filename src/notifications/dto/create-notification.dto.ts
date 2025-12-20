import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';
import { NotificationType, NotificationPriority } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.LOW_STOCK })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Low Stock Alert' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Item XYZ is running low on stock' })
  @IsString()
  message: string;

  @ApiProperty({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @ApiProperty({ required: false, example: { itemId: '123', quantity: 5 } })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiProperty({ required: false, example: 'item-uuid-here' })
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  @ApiProperty({ required: false, example: 'inventory_item' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}
