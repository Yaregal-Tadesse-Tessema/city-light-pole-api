import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';
import { PurchaseRequestItem } from './entities/purchase-request-item.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction, TransactionType } from './entities/inventory-transaction.entity';
import { MaterialRequest, MaterialRequestStatus } from './entities/material-request.entity';
import { MaterialRequestItem, RequestItemStatus } from './entities/material-request-item.entity';
import { MaintenanceSchedule, ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { ReceivePurchaseRequestDto } from './dto/receive-purchase-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PurchaseRequestService {
  constructor(
    @InjectRepository(PurchaseRequest)
    private purchaseRequestRepository: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseRequestItem)
    private purchaseRequestItemRepository: Repository<PurchaseRequestItem>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(MaterialRequest)
    private materialRequestRepository: Repository<MaterialRequest>,
    @InjectRepository(MaterialRequestItem)
    private materialRequestItemRepository: Repository<MaterialRequestItem>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceScheduleRepository: Repository<MaintenanceSchedule>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreatePurchaseRequestDto, userId: string): Promise<PurchaseRequest> {
    const items: PurchaseRequestItem[] = [];
    let totalCost = 0;

    for (const itemDto of createDto.items) {
      const item = await this.inventoryRepository.findOne({
        where: { code: itemDto.itemCode },
      });

      if (!item) {
        throw new NotFoundException(`Inventory item with code ${itemDto.itemCode} not found`);
      }

      const itemTotal = itemDto.quantity * itemDto.unitCost;
      totalCost += itemTotal;

      const purchaseItem = this.purchaseRequestItemRepository.create({
        inventoryItemCode: itemDto.itemCode,
        requestedQuantity: itemDto.quantity,
        unitCost: itemDto.unitCost,
        totalCost: itemTotal,
      });

      items.push(purchaseItem);
    }

    const purchaseRequest = this.purchaseRequestRepository.create({
      materialRequestId: createDto.materialRequestId,
      requestedById: userId,
      status: PurchaseRequestStatus.PENDING,
      totalCost,
      supplierName: createDto.supplierName,
      supplierContact: createDto.supplierContact,
      notes: createDto.notes,
      items,
    });

    return this.purchaseRequestRepository.save(purchaseRequest);
  }

  async findAll(filters?: { status?: PurchaseRequestStatus }) {
    const queryBuilder = this.purchaseRequestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.items', 'items')
      .leftJoinAndSelect('items.inventoryItem', 'inventoryItem')
      .leftJoinAndSelect('request.requestedBy', 'requestedBy')
      .leftJoinAndSelect('request.approvedBy', 'approvedBy')
      .leftJoinAndSelect('request.materialRequest', 'materialRequest');

    if (filters?.status) {
      queryBuilder.andWhere('request.status = :status', { status: filters.status });
    }

    return queryBuilder.orderBy('request.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<PurchaseRequest> {
    const request = await this.purchaseRequestRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.inventoryItem',
        'requestedBy',
        'approvedBy',
        'materialRequest',
        'materialRequest.maintenanceSchedule',
      ],
    });

    if (!request) {
      throw new NotFoundException(`Purchase request with ID ${id} not found`);
    }

    return request;
  }

  async approve(id: string, approveDto: ApprovePurchaseRequestDto, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== PurchaseRequestStatus.PENDING) {
      throw new BadRequestException(`Purchase request is not in PENDING status`);
    }

    if (approveDto.approve) {
      request.status = PurchaseRequestStatus.APPROVED;
      request.approvedById = userId;
      request.approvedAt = new Date();
    } else {
      request.status = PurchaseRequestStatus.REJECTED;
      request.approvedById = userId;
      request.approvedAt = new Date();
      request.rejectionReason = approveDto.rejectionReason || 'Purchase request rejected';
    }

    return this.purchaseRequestRepository.save(request);
  }

  async markReadyToDeliver(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException(`Purchase request must be APPROVED before marking as ready to deliver`);
    }

    request.status = PurchaseRequestStatus.READY_TO_DELIVER;
    request.readyToDeliverAt = new Date();
    request.readyToDeliverById = userId;

    return this.purchaseRequestRepository.save(request);
  }

  async complete(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== PurchaseRequestStatus.READY_TO_DELIVER) {
      throw new BadRequestException(`Purchase request must be READY_TO_DELIVER before completing`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Add items to inventory
      for (const item of request.items) {
        const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
          where: { code: item.inventoryItemCode },
        });

        if (!inventoryItem) {
          throw new NotFoundException(`Inventory item ${item.inventoryItemCode} not found`);
        }

        // Update stock
        const stockBefore = Number(inventoryItem.currentStock);
        const quantityToAdd = Number(item.requestedQuantity);
        inventoryItem.currentStock = stockBefore + quantityToAdd;

        await queryRunner.manager.save(inventoryItem);

        // Create transaction record
        const transaction = this.transactionRepository.create({
          itemCode: item.inventoryItemCode,
          type: TransactionType.PURCHASE,
          quantity: quantityToAdd,
          stockBefore,
          stockAfter: stockBefore + quantityToAdd,
          userId,
          reference: `Purchase Request: ${request.id}`,
          notes: `Completed purchase request delivery`,
        });

        await queryRunner.manager.save(transaction);
      }

      // Mark purchase request as delivered
      request.status = PurchaseRequestStatus.DELIVERED;
      request.completedAt = new Date();
      request.completedById = userId;
      await queryRunner.manager.save(request);

      // Check if maintenance should be marked as STARTED
      if (request.maintenanceScheduleId) {
        const maintenance = await queryRunner.manager.findOne(MaintenanceSchedule, {
          where: { id: request.maintenanceScheduleId },
          relations: ['materialRequests', 'purchaseRequests'],
        });

        if (maintenance) {
          const allMaterialRequests = maintenance.materialRequests || [];
          const allPurchaseRequests = maintenance.purchaseRequests || [];

          const allMaterialsDelivered = allMaterialRequests.every(mr => mr.status === MaterialRequestStatus.DELIVERED);
          const allPurchasesCompleted = allPurchaseRequests.every(pr =>
            pr.status === PurchaseRequestStatus.DELIVERED
          );

          if (allMaterialsDelivered && allPurchasesCompleted) {
            maintenance.status = ScheduleStatus.STARTED;
            if (!maintenance.startedAt) {
              maintenance.startedAt = new Date();
            }
            await queryRunner.manager.save(maintenance);
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async receive(id: string, receiveDto: ReceivePurchaseRequestDto, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== PurchaseRequestStatus.APPROVED && request.status !== PurchaseRequestStatus.ORDERED) {
      throw new BadRequestException(
        `Purchase request must be APPROVED or ORDERED before receiving. Current status: ${request.status}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Add items to inventory
      for (const item of request.items) {
        const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
          where: { code: item.inventoryItemCode },
        });

        if (!inventoryItem) {
          throw new NotFoundException(`Inventory item ${item.inventoryItemCode} not found`);
        }

        // Update stock
        const stockBefore = Number(inventoryItem.currentStock);
        const quantityToAdd = Number(item.requestedQuantity);
        inventoryItem.currentStock = stockBefore + quantityToAdd;
        await queryRunner.manager.save(inventoryItem);

        // Create transaction
        const transaction = queryRunner.manager.create(InventoryTransaction, {
          itemCode: item.inventoryItemCode,
          type: TransactionType.PURCHASE,
          quantity: quantityToAdd,
          stockBefore,
          stockAfter: stockBefore + quantityToAdd,
          userId,
          reference: `PURCHASE-${request.id}`,
          notes: receiveDto.notes || `Received from purchase request ${request.id}`,
        });
        await queryRunner.manager.save(transaction);
      }

      // Update purchase request status
      request.status = PurchaseRequestStatus.ARRIVED_IN_STOCK;
      request.receivedAt = new Date();
      await queryRunner.manager.save(request);

      // If linked to maintenance schedule (directly or through material request), check if all related purchases are received
      let maintenanceScheduleIdToCheck = request.maintenanceScheduleId;

      // If not directly linked, check if linked through material request
      if (!maintenanceScheduleIdToCheck && request.materialRequestId) {
        const materialRequest = await queryRunner.manager.findOne(MaterialRequest, {
          where: { id: request.materialRequestId },
          select: ['maintenanceScheduleId'],
        });
        maintenanceScheduleIdToCheck = materialRequest?.maintenanceScheduleId;
      }

      if (maintenanceScheduleIdToCheck) {
        console.log(`🔗 Purchase request linked to maintenance schedule: ${maintenanceScheduleIdToCheck}`);
        await this.checkAndUpdateMaintenanceStatus(queryRunner, maintenanceScheduleIdToCheck);
      }

      // Send notification to purchase managers
      const purchaseTitle = request.supplierName
        ? `Purchase from ${request.supplierName}`
        : `Purchase Request ${request.id}`;

      await this.notificationsService.notifyPurchaseCompleted(
        request.id,
        purchaseTitle,
      );

      // If linked to material request, update material request items
      if (request.materialRequestId) {
        const materialRequest = await queryRunner.manager.findOne(MaterialRequest, {
          where: { id: request.materialRequestId },
          relations: ['items'],
        });

        if (materialRequest) {
          // Update purchase items in material request to fulfilled
          for (const purchaseItem of request.items) {
            const materialRequestItem = materialRequest.items.find(
              (item) => item.inventoryItemCode === purchaseItem.inventoryItemCode,
            );

            if (materialRequestItem && materialRequestItem.requestType === 'PURCHASE') {
              materialRequestItem.status = RequestItemStatus.FULFILLED;
              materialRequestItem.actualQuantityUsed = purchaseItem.requestedQuantity;
              await queryRunner.manager.save(materialRequestItem);
            }
          }

          // Check if all items are fulfilled
          const allFulfilled = materialRequest.items.every(
            (item) => item.status === RequestItemStatus.FULFILLED,
          );

          if (allFulfilled) {
            materialRequest.status = MaterialRequestStatus.FULFILLED;
            await queryRunner.manager.save(materialRequest);

            // Check if all material requests for this maintenance are fulfilled
            if (materialRequest.maintenanceScheduleId) {
              await this.checkAndUpdateMaintenanceStatus(queryRunner, materialRequest.maintenanceScheduleId);
            }
          }
        }
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async markAsOrdered(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException(`Purchase request must be APPROVED before marking as ORDERED`);
    }

    request.status = PurchaseRequestStatus.ORDERED;
    request.orderedAt = new Date();
    return this.purchaseRequestRepository.save(request);
  }

  async deliver(id: string, userId: string) {
    const request = await this.findOne(id);

    if (request.status !== PurchaseRequestStatus.ARRIVED_IN_STOCK) {
      throw new BadRequestException(`Purchase request must be ARRIVED_IN_STOCK before delivering. Current status: ${request.status}`);
    }

    // Update status to DELIVERED
    request.status = PurchaseRequestStatus.DELIVERED;
    request.receivedAt = new Date(); // Reuse receivedAt for delivery timestamp

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(request);

      // Check if linked to maintenance schedule and update status
      let maintenanceScheduleIdToCheck = request.maintenanceScheduleId;

      // If not directly linked, check if linked through material request
      if (!maintenanceScheduleIdToCheck && request.materialRequestId) {
        const materialRequest = await queryRunner.manager.findOne(MaterialRequest, {
          where: { id: request.materialRequestId },
          select: ['maintenanceScheduleId'],
        });
        maintenanceScheduleIdToCheck = materialRequest?.maintenanceScheduleId;
      }

      if (maintenanceScheduleIdToCheck) {
        console.log(`🔗 Purchase request delivered, checking maintenance schedule: ${maintenanceScheduleIdToCheck}`);
        await this.checkAndUpdateMaintenanceStatus(queryRunner, maintenanceScheduleIdToCheck);
      }

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async checkAndUpdateMaintenanceStatus(queryRunner: any, maintenanceScheduleId: string) {
    console.log(`🔍 Checking maintenance status update for schedule: ${maintenanceScheduleId}`);

    // Find the maintenance schedule
    const maintenanceSchedule = await queryRunner.manager.findOne(MaintenanceSchedule, {
      where: { id: maintenanceScheduleId },
    });

    if (!maintenanceSchedule) {
      console.log(`❌ Maintenance schedule ${maintenanceScheduleId} not found`);
      return;
    }

    console.log(`📊 Current maintenance status: ${maintenanceSchedule.status}`);

    if (maintenanceSchedule.status === ScheduleStatus.STARTED ||
        maintenanceSchedule.status === ScheduleStatus.COMPLETED ||
        maintenanceSchedule.status === ScheduleStatus.STARTED) {
      console.log(`⏭️ Maintenance already ${maintenanceSchedule.status}, no update needed`);
      return; // Don't update if already started or completed
    }

    // Check if all material requests for this maintenance schedule are fulfilled
    const materialRequests = await queryRunner.manager.find(MaterialRequest, {
      where: { maintenanceScheduleId },
    });

    // Check if all purchase requests directly linked to this maintenance are completed
    const directPurchaseRequests = await queryRunner.manager.find(PurchaseRequest, {
      where: { maintenanceScheduleId },
    });

    console.log(`📋 Found ${materialRequests.length} material requests and ${directPurchaseRequests.length} direct purchase requests`);

    // Check if all material requests are fulfilled (accept both DELIVERED and FULFILLED)
    let allMaterialRequestsFulfilled = true;
    for (const materialRequest of materialRequests) {
      if (materialRequest.status !== MaterialRequestStatus.FULFILLED &&
          materialRequest.status !== MaterialRequestStatus.DELIVERED) {
        console.log(`❌ Material request ${materialRequest.id} status: ${materialRequest.status} (not FULFILLED or DELIVERED)`);
        allMaterialRequestsFulfilled = false;
        break;
      }
    }

    // Check if all direct purchase requests are completed
    let allDirectPurchasesCompleted = true;
    for (const purchaseRequest of directPurchaseRequests) {
      if (purchaseRequest.status !== PurchaseRequestStatus.DELIVERED) {
        console.log(`❌ Direct purchase request ${purchaseRequest.id} status: ${purchaseRequest.status} (not DELIVERED)`);
        allDirectPurchasesCompleted = false;
        break;
      }
    }

    console.log(`✅ Material requests completed (FULFILLED/DELIVERED): ${allMaterialRequestsFulfilled}`);
    console.log(`✅ Direct purchases completed: ${allDirectPurchasesCompleted}`);

    // If all material requests are fulfilled AND all direct purchase requests are completed
    if (allMaterialRequestsFulfilled && allDirectPurchasesCompleted) {
      console.log(`🚀 Updating maintenance status to STARTED`);
      maintenanceSchedule.status = ScheduleStatus.STARTED;
      maintenanceSchedule.startedAt = new Date();
      await queryRunner.manager.save(maintenanceSchedule);
      console.log(`✅ Maintenance status updated successfully`);
    } else {
      console.log(`⏳ Not all requirements met, maintenance status remains ${maintenanceSchedule.status}`);
    }
  }
}


