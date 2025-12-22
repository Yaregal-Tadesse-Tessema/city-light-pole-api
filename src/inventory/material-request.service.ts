import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaterialRequest, MaterialRequestStatus } from './entities/material-request.entity';
import { MaterialRequestItem, RequestItemType, RequestItemStatus } from './entities/material-request-item.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction, TransactionType } from './entities/inventory-transaction.entity';
import { MaintenanceSchedule, ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { CreateMaterialRequestDto } from './dto/create-material-request.dto';
import { ApproveMaterialRequestDto, ReceiveMaterialRequestDto } from './dto/approve-material-request.dto';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';
import { PurchaseRequestItem } from './entities/purchase-request-item.entity';

@Injectable()
export class MaterialRequestService {
  constructor(
    @InjectRepository(MaterialRequest)
    private materialRequestRepository: Repository<MaterialRequest>,
    @InjectRepository(MaterialRequestItem)
    private materialRequestItemRepository: Repository<MaterialRequestItem>,
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(MaintenanceSchedule)
    private maintenanceRepository: Repository<MaintenanceSchedule>,
    @InjectRepository(PurchaseRequest)
    private purchaseRequestRepository: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseRequestItem)
    private purchaseRequestItemRepository: Repository<PurchaseRequestItem>,
    private dataSource: DataSource,
  ) {}

  async create(createDto: CreateMaterialRequestDto, userId: string): Promise<MaterialRequest> {
    console.log('🔍 Creating material request with data:', JSON.stringify(createDto, null, 2));

    // Verify maintenance schedule exists
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: createDto.maintenanceScheduleId },
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Maintenance schedule with ID ${createDto.maintenanceScheduleId} not found`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check availability and split requests
      const materialRequestItems: MaterialRequestItem[] = [];
      const purchaseRequestItems: { item: InventoryItem; quantity: number; unitCost: number }[] = [];

      for (const itemDto of createDto.items) {
        console.log(`🔍 Looking up inventory item with code: "${itemDto.itemCode}"`);

        const item = await queryRunner.manager.findOne(InventoryItem, {
          where: { code: itemDto.itemCode },
        });

        if (!item) {
          console.error(`❌ Inventory item with code "${itemDto.itemCode}" not found`);
          throw new NotFoundException(`Inventory item with code ${itemDto.itemCode} not found`);
        }

        console.log(`✅ Found inventory item: ${item.name} (${item.code})`);

        // If we have stock available, create material request item for available quantity
        if (item.currentStock > 0) {
          const materialQuantity = Math.min(itemDto.quantity, item.currentStock);

          const requestItem = this.materialRequestItemRepository.create({
            inventoryItemCode: itemDto.itemCode,
            requestedQuantity: materialQuantity,
            availableQuantity: item.currentStock,
            requestType: RequestItemType.USAGE,
            status: RequestItemStatus.PENDING,
          });

          materialRequestItems.push(requestItem);
        }

        // If requested quantity exceeds stock, create purchase request for remaining
        const remainingQuantity = Math.max(0, itemDto.quantity - item.currentStock);
        if (remainingQuantity > 0) {
          purchaseRequestItems.push({
            item,
            quantity: remainingQuantity,
            unitCost: item.unitCost || 0,
          });
        }
      }

      // Create material request only if we have items to request from stock
      let savedRequest: MaterialRequest | null = null;

      if (materialRequestItems.length > 0) {
        const materialRequest = this.materialRequestRepository.create({
          maintenanceScheduleId: createDto.maintenanceScheduleId,
          requestedById: userId,
          status: MaterialRequestStatus.PENDING,
          notes: createDto.notes,
          items: materialRequestItems,
        });

        savedRequest = await queryRunner.manager.save(materialRequest);
      }

      // Create purchase request if we have items to purchase
      if (purchaseRequestItems.length > 0) {
        const purchaseRequest = this.purchaseRequestRepository.create({
          maintenanceScheduleId: createDto.maintenanceScheduleId,
          requestedById: userId,
          status: PurchaseRequestStatus.PENDING,
          notes: `Purchase request for remaining items - ${createDto.notes}`,
        });

        const savedPurchaseRequest = await queryRunner.manager.save(purchaseRequest);

        // Create purchase request items
        for (const purchaseItem of purchaseRequestItems) {
          const purchaseRequestItem = this.purchaseRequestItemRepository.create({
            purchaseRequestId: savedPurchaseRequest.id,
            inventoryItemCode: purchaseItem.item.code,
            requestedQuantity: purchaseItem.quantity,
            unitCost: purchaseItem.unitCost,
            totalCost: purchaseItem.quantity * purchaseItem.unitCost,
          });

          await queryRunner.manager.save(purchaseRequestItem);
        }
      }

      await queryRunner.commitTransaction();

      // Return the material request if it was created, otherwise return null or throw an error
      if (savedRequest) {
        return this.findOne(savedRequest.id);
      } else if (purchaseRequestItems.length > 0) {
        // If only purchase requests were created, we might want to return some indication
        // For now, let's return null and handle this in the controller
        return null as any;
      } else {
        throw new BadRequestException('No valid items to request');
      }

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: { status?: MaterialRequestStatus; maintenanceScheduleId?: string }) {
    const queryBuilder = this.materialRequestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.items', 'items')
      .leftJoinAndSelect('items.inventoryItem', 'inventoryItem')
      .leftJoinAndSelect('request.requestedBy', 'requestedBy')
      .leftJoinAndSelect('request.approvedBy', 'approvedBy')
      .leftJoinAndSelect('request.maintenanceSchedule', 'maintenanceSchedule');

    if (filters?.status) {
      queryBuilder.andWhere('request.status = :status', { status: filters.status });
    }

    if (filters?.maintenanceScheduleId) {
      queryBuilder.andWhere('request.maintenanceScheduleId = :maintenanceScheduleId', {
        maintenanceScheduleId: filters.maintenanceScheduleId,
      });
    }

    return queryBuilder.orderBy('request.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<MaterialRequest> {
    const request = await this.materialRequestRepository.findOne({
      where: { id },
      relations: [
        'items',
        'items.inventoryItem',
        'requestedBy',
        'approvedBy',
        'maintenanceSchedule',
        'purchaseRequests',
        'purchaseRequests.items',
        'purchaseRequests.items.inventoryItem',
      ],
    });

    if (!request) {
      throw new NotFoundException(`Material request with ID ${id} not found`);
    }

    return request;
  }

  async approve(id: string, approveDto: ApproveMaterialRequestDto, userId: string) {
    const request = await this.findOne(id);

    // Allow approving PENDING requests, or re-approving APPROVED ones for backward compatibility
    if (request.status !== MaterialRequestStatus.PENDING && request.status !== MaterialRequestStatus.APPROVED) {
      throw new BadRequestException(`Material request must be in PENDING or APPROVED status to be approved`);
    }

    // Handle legacy APPROVED status (treat as already approved)
    if (request.status === MaterialRequestStatus.APPROVED) {
      request.status = MaterialRequestStatus.AWAITING_DELIVERY;
      request.approvedById = userId;
      request.approvedAt = new Date();
      await this.materialRequestRepository.save(request);
      return this.findOne(id);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (approveDto.approve) {
        // Approve the request
        request.status = MaterialRequestStatus.AWAITING_DELIVERY;
        request.approvedById = userId;
        request.approvedAt = new Date();
        await queryRunner.manager.save(request);

        // Process each item

        for (const item of request.items) {
          if (item.requestType === RequestItemType.USAGE) {
            // Deduct stock for usage items
            const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
              where: { code: item.inventoryItemCode },
            });

            if (!inventoryItem) {
              throw new NotFoundException(`Inventory item ${item.inventoryItemCode} not found`);
            }

            // Convert to numbers to ensure proper comparison
            const currentStock = Number(inventoryItem.currentStock);
            const requestedQuantity = Number(item.requestedQuantity);

            console.log(`Checking stock for ${inventoryItem.name}: currentStock=${currentStock}, requestedQuantity=${requestedQuantity}, comparison: ${currentStock} < ${requestedQuantity} = ${currentStock < requestedQuantity}`);

            if (currentStock < requestedQuantity) {
              throw new BadRequestException(
                `Insufficient stock for ${inventoryItem.name}. Available: ${currentStock}, Required: ${requestedQuantity}`,
              );
            }

            // Update stock
            const stockBefore = Number(inventoryItem.currentStock);
            const quantityToSubtract = Number(item.requestedQuantity);
            inventoryItem.currentStock = stockBefore - quantityToSubtract;
            await queryRunner.manager.save(inventoryItem);

            // Create transaction
            const transaction = queryRunner.manager.create(InventoryTransaction, {
              itemCode: item.inventoryItemCode,
              type: TransactionType.USAGE,
              quantity: quantityToSubtract,
              stockBefore,
              stockAfter: stockBefore - quantityToSubtract,
              userId,
              reference: `MAINTENANCE-${request.maintenanceScheduleId}`,
              notes: `Used for maintenance schedule ${request.maintenanceScheduleId}`,
            });
            await queryRunner.manager.save(transaction);

            // Update request item
            item.status = RequestItemStatus.FULFILLED;
            item.actualQuantityUsed = item.requestedQuantity;
            await queryRunner.manager.save(item);
          // Note: PURCHASE items are no longer created in material requests
          // Purchase requests are created separately during material request creation
        }
      }
      } else {
        // Reject the request
        request.status = MaterialRequestStatus.REJECTED;
        request.approvedById = userId;
        request.approvedAt = new Date();
        request.rejectionReason = approveDto.rejectionReason || 'Request rejected';

        for (const item of request.items) {
          item.status = RequestItemStatus.REJECTED;
          await queryRunner.manager.save(item);
        }

        await queryRunner.manager.save(request);
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

  async receive(id: string, receiveDto: ReceiveMaterialRequestDto, userId: string): Promise<MaterialRequest> {
    const request = await this.materialRequestRepository.findOne({
      where: { id },
      relations: ['maintenanceSchedule'],
    });

    if (!request) {
      throw new NotFoundException(`Material request with ID ${id} not found`);
    }

    if (request.status !== MaterialRequestStatus.AWAITING_DELIVERY) {
      throw new BadRequestException(`Material request must be in AWAITING_DELIVERY status to be received`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mark material request as delivered
      request.status = MaterialRequestStatus.DELIVERED;
      request.deliveredAt = new Date();
      request.deliveredById = userId;
      request.notes = receiveDto.notes || request.notes;
      await queryRunner.manager.save(request);

      // Check maintenance status based on material and purchase request completion
      if (request.maintenanceSchedule) {
        const allMaterialRequests = await queryRunner.manager.find(MaterialRequest, {
          where: { maintenanceScheduleId: request.maintenanceScheduleId },
        });

        const allPurchaseRequests = await queryRunner.manager.find(PurchaseRequest, {
          where: { maintenanceScheduleId: request.maintenanceScheduleId },
        });

        const allMaterialsDelivered = allMaterialRequests.every(mr => mr.status === MaterialRequestStatus.DELIVERED);
        const allPurchasesCompleted = allPurchaseRequests.every(pr => pr.status === PurchaseRequestStatus.COMPLETED);

        // Set maintenance status based on completion state
        if (allMaterialsDelivered && allPurchasesCompleted) {
          // All materials and purchases are complete - set to STARTED
          request.maintenanceSchedule.status = ScheduleStatus.STARTED;
          request.maintenanceSchedule.startedAt = new Date();
        } else if (allMaterialsDelivered && allPurchaseRequests.length > 0) {
          // Materials are delivered but purchases are still pending - set to PARTIALLY_STARTED
          request.maintenanceSchedule.status = ScheduleStatus.PARTIALLY_STARTED;
          if (!request.maintenanceSchedule.startedAt) {
            request.maintenanceSchedule.startedAt = new Date();
          }
        } else if (allMaterialsDelivered && allPurchaseRequests.length === 0) {
          // No purchase requests needed, all materials delivered - set to STARTED
          request.maintenanceSchedule.status = ScheduleStatus.STARTED;
          request.maintenanceSchedule.startedAt = new Date();
        }

        await queryRunner.manager.save(request.maintenanceSchedule);
      }

      // Also run the comprehensive check to ensure maintenance status is correct
      // This handles cases where purchase requests were completed before materials were delivered
      const allMaterialRequests = await queryRunner.manager.find(MaterialRequest, {
        where: { maintenanceScheduleId: request.maintenanceScheduleId },
      });

      const allPurchaseRequests = await queryRunner.manager.find(PurchaseRequest, {
        where: { maintenanceScheduleId: request.maintenanceScheduleId },
      });

      const allMaterialsCompleted = allMaterialRequests.every(mr =>
        mr.status === MaterialRequestStatus.FULFILLED || mr.status === MaterialRequestStatus.DELIVERED
      );

      const allPurchasesCompleted = allPurchaseRequests.every(pr =>
        pr.status === PurchaseRequestStatus.COMPLETED
      );

      if (allMaterialsCompleted && allPurchasesCompleted) {
        request.maintenanceSchedule.status = ScheduleStatus.STARTED;
        if (!request.maintenanceSchedule.startedAt) {
          request.maintenanceSchedule.startedAt = new Date();
        }
        await queryRunner.manager.save(request.maintenanceSchedule);
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

  async getByMaintenanceScheduleId(maintenanceScheduleId: string): Promise<MaterialRequest | null> {
    return this.materialRequestRepository.findOne({
      where: { maintenanceScheduleId },
      relations: [
        'items',
        'items.inventoryItem',
        'requestedBy',
        'approvedBy',
      ],
    });
  }
}


