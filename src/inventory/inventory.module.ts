import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { Category } from './entities/category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MaterialRequestService } from './material-request.service';
import { MaterialRequestController } from './material-request.controller';
import { MaterialRequest } from './entities/material-request.entity';
import { MaterialRequestItem } from './entities/material-request-item.entity';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequest } from './entities/purchase-request.entity';
import { PurchaseRequestItem } from './entities/purchase-request-item.entity';
import { MaintenanceModule } from '../maintenance/maintenance.module';
import { MaintenanceSchedule } from '../maintenance/entities/maintenance-schedule.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryItem,
      InventoryTransaction,
      Category,
      MaterialRequest,
      MaterialRequestItem,
      PurchaseRequest,
      PurchaseRequestItem,
      MaintenanceSchedule,
    ]),
    MaintenanceModule,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [
    InventoryController,
    CategoryController,
    MaterialRequestController,
    PurchaseRequestController,
  ],
  providers: [
    InventoryService,
    CategoryService,
    MaterialRequestService,
    PurchaseRequestService,
  ],
  exports: [
    InventoryService,
    MaterialRequestService,
    PurchaseRequestService,
  ],
})
export class InventoryModule {}


