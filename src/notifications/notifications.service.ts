import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RolesService } from '../roles/roles.service';
import { SystemRole } from '../roles/entities/role.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private rolesService: RolesService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async findUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // Role-based notification methods
  async notifyLowStock(itemId: string, itemName: string, currentStock: number, minimumThreshold: number): Promise<void> {
    const inventoryManagers = await this.rolesService.getUsersByRole(SystemRole.INVENTORY_MANAGER);

    const notifications = inventoryManagers.map(userRole =>
      this.notificationRepository.create({
        userId: userRole.userId,
        type: NotificationType.LOW_STOCK,
        title: 'Low Stock Alert',
        message: `Item "${itemName}" is running low on stock. Current: ${currentStock}, Minimum: ${minimumThreshold}`,
        priority: NotificationPriority.HIGH,
        data: { itemId, currentStock, minimumThreshold },
        relatedEntityId: itemId,
        relatedEntityType: 'inventory_item',
      })
    );

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }

  async notifyPurchaseCompleted(purchaseRequestId: string, requestTitle: string): Promise<void> {
    const purchaseManagers = await this.rolesService.getUsersByRole(SystemRole.PURCHASE_MANAGER);

    const notifications = purchaseManagers.map(userRole =>
      this.notificationRepository.create({
        userId: userRole.userId,
        type: NotificationType.PURCHASE_COMPLETED,
        title: 'Purchase Request Completed',
        message: `Purchase request "${requestTitle}" has been completed and items are now available.`,
        priority: NotificationPriority.MEDIUM,
        data: { purchaseRequestId },
        relatedEntityId: purchaseRequestId,
        relatedEntityType: 'purchase_request',
      })
    );

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }

  async notifyIssueCreated(issueId: string, issueTitle: string, poleCode: string): Promise<void> {
    const issueManagers = await this.rolesService.getUsersByRole(SystemRole.ISSUE_MANAGER);

    const notifications = issueManagers.map(userRole =>
      this.notificationRepository.create({
        userId: userRole.userId,
        type: NotificationType.ISSUE_CREATED,
        title: 'New Issue Reported',
        message: `A new issue "${issueTitle}" has been reported for pole ${poleCode}.`,
        priority: NotificationPriority.HIGH,
        data: { issueId, poleCode },
        relatedEntityId: issueId,
        relatedEntityType: 'issue',
      })
    );

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }

  async notifyMaintenanceCreated(maintenanceId: string, maintenanceTitle: string, poleCode: string): Promise<void> {
    const maintenanceManagers = await this.rolesService.getUsersByRole(SystemRole.MAINTENANCE_MANAGER);

    const notifications = maintenanceManagers.map(userRole =>
      this.notificationRepository.create({
        userId: userRole.userId,
        type: NotificationType.MAINTENANCE_CREATED,
        title: 'New Maintenance Scheduled',
        message: `New maintenance "${maintenanceTitle}" has been scheduled for pole ${poleCode}.`,
        priority: NotificationPriority.MEDIUM,
        data: { maintenanceId, poleCode },
        relatedEntityId: maintenanceId,
        relatedEntityType: 'maintenance',
      })
    );

    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }
  }
}
