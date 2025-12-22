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

      // Mark purchase request as completed
      request.status = PurchaseRequestStatus.COMPLETED;
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
          pr.status === PurchaseRequestStatus.COMPLETED || pr.status === PurchaseRequestStatus.RECEIVED
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

    if (request.status !== PurchaseRequestStatus.APPROVED && request.status !== PurchaseRequestStatus.READY_TO_DELIVER) {
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
      request.status = PurchaseRequestStatus.COMPLETED;
      request.receivedAt = new Date();
      await queryRunner.manager.save(request);

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

    request.status = PurchaseRequestStatus.APPROVED;
    request.orderedAt = new Date();
    return this.purchaseRequestRepository.save(request);
  }
}


