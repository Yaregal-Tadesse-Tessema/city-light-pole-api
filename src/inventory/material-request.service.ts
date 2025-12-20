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
import { ApproveMaterialRequestDto } from './dto/approve-material-request.dto';
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
    // Verify maintenance schedule exists
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id: createDto.maintenanceScheduleId },
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Maintenance schedule with ID ${createDto.maintenanceScheduleId} not found`,
      );
    }

    // Check if material request already exists for this maintenance
    const existing = await this.materialRequestRepository.findOne({
      where: { maintenanceScheduleId: createDto.maintenanceScheduleId },
    });

    if (existing) {
      throw new BadRequestException(
        `Material request already exists for maintenance schedule ${createDto.maintenanceScheduleId}`,
      );
    }

    // Check availability and create request items
    const requestItems: MaterialRequestItem[] = [];
    const purchaseItems: { item: InventoryItem; quantity: number; unitCost: number }[] = [];

    for (const itemDto of createDto.items) {
      const item = await this.inventoryRepository.findOne({
        where: { code: itemDto.itemCode },
      });

      if (!item) {
        throw new NotFoundException(`Inventory item with code ${itemDto.itemCode} not found`);
      }

      const available = item.currentStock >= itemDto.quantity;
      const requestType = available ? RequestItemType.USAGE : RequestItemType.PURCHASE;

      const requestItem = this.materialRequestItemRepository.create({
        inventoryItemCode: itemDto.itemCode,
        requestedQuantity: itemDto.quantity,
        availableQuantity: item.currentStock,
        requestType,
        status: RequestItemStatus.PENDING,
      });

      requestItems.push(requestItem);

      // If not available, prepare for purchase request
      if (!available) {
        purchaseItems.push({
          item,
          quantity: itemDto.quantity,
          unitCost: item.unitCost || 0,
        });
      }
    }

    // Create material request
    const materialRequest = this.materialRequestRepository.create({
      maintenanceScheduleId: createDto.maintenanceScheduleId,
      requestedById: userId,
      status: MaterialRequestStatus.PENDING,
      notes: createDto.notes,
      items: requestItems,
    });

    const savedRequest = await this.materialRequestRepository.save(materialRequest);

    return savedRequest;
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

    if (request.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException(`Material request is not in PENDING status`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (approveDto.approve) {
        // Approve the request
        request.status = MaterialRequestStatus.APPROVED;
        request.approvedById = userId;
        request.approvedAt = new Date();
        await queryRunner.manager.save(request);

        // Process each item
        const purchaseRequestItems: PurchaseRequestItem[] = [];
        let needsPurchase = false;

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
            const stockBefore = inventoryItem.currentStock;
            inventoryItem.currentStock = stockBefore - item.requestedQuantity;
            await queryRunner.manager.save(inventoryItem);

            // Create transaction
            const transaction = queryRunner.manager.create(InventoryTransaction, {
              itemCode: item.inventoryItemCode,
              type: TransactionType.USAGE,
              quantity: item.requestedQuantity,
              stockBefore,
              stockAfter: inventoryItem.currentStock,
              userId,
              reference: `MAINTENANCE-${request.maintenanceScheduleId}`,
              notes: `Used for maintenance schedule ${request.maintenanceScheduleId}`,
            });
            await queryRunner.manager.save(transaction);

            // Update request item
            item.status = RequestItemStatus.FULFILLED;
            item.actualQuantityUsed = item.requestedQuantity;
            await queryRunner.manager.save(item);
          } else if (item.requestType === RequestItemType.PURCHASE) {
            // Mark for purchase
            item.status = RequestItemStatus.APPROVED;
            await queryRunner.manager.save(item);

            const inventoryItem = await queryRunner.manager.findOne(InventoryItem, {
              where: { code: item.inventoryItemCode },
            });

            if (inventoryItem) {
              const purchaseItem = queryRunner.manager.create(PurchaseRequestItem, {
                inventoryItemCode: item.inventoryItemCode,
                requestedQuantity: item.requestedQuantity,
                unitCost: inventoryItem.unitCost || 0,
                totalCost: item.requestedQuantity * (inventoryItem.unitCost || 0),
              });
              purchaseRequestItems.push(purchaseItem);
              needsPurchase = true;
            }
          }
        }

        // Create purchase request if needed
        if (needsPurchase && purchaseRequestItems.length > 0) {
          const totalCost = purchaseRequestItems.reduce((sum, item) => sum + item.totalCost, 0);

          const purchaseRequest = queryRunner.manager.create(PurchaseRequest, {
            materialRequestId: request.id,
            requestedById: userId,
            status: PurchaseRequestStatus.PENDING,
            totalCost,
            items: purchaseRequestItems,
          });

          await queryRunner.manager.save(purchaseRequest);
        }

        // Update maintenance schedule status to STARTED
        const maintenance = await queryRunner.manager.findOne(MaintenanceSchedule, {
          where: { id: request.maintenanceScheduleId },
        });

        if (maintenance) {
          maintenance.status = ScheduleStatus.STARTED;
          await queryRunner.manager.save(maintenance);
        }

        await queryRunner.commitTransaction();
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
        await queryRunner.commitTransaction();
      }

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, updateDto: any, userId: string) {
    const request = await this.findOne(id);

    // Only allow updating PENDING requests
    if (request.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Only PENDING material requests can be updated');
    }

    // Update allowed fields
    if (updateDto.description) {
      request.description = updateDto.description;
    }

    // Update items if provided
    if (updateDto.items) {
      // Remove existing items
      await this.materialRequestItemRepository.delete({ materialRequestId: id });

      // Add new items
      const items: MaterialRequestItem[] = [];
      for (const itemDto of updateDto.items) {
        const item = await this.inventoryRepository.findOne({
          where: { code: itemDto.itemCode },
        });

        if (!item) {
          throw new NotFoundException(`Inventory item with code ${itemDto.itemCode} not found`);
        }

        const requestType = itemDto.requestType || (item.currentStock >= itemDto.requestedQuantity ? RequestItemType.USAGE : RequestItemType.PURCHASE);

        const requestItem = this.materialRequestItemRepository.create({
          inventoryItemCode: itemDto.itemCode,
          requestedQuantity: itemDto.requestedQuantity,
          availableQuantity: item.currentStock,
          requestType,
          status: RequestItemStatus.PENDING,
          notes: itemDto.notes,
        });

        items.push(requestItem);
      }

      request.items = items;
    }

    return this.materialRequestRepository.save(request);
  }

  async remove(id: string, userId: string): Promise<void> {
    const request = await this.findOne(id);

    // Only allow deleting PENDING requests
    if (request.status !== MaterialRequestStatus.PENDING) {
      throw new BadRequestException('Only PENDING material requests can be deleted');
    }

    // Delete associated items first
    await this.materialRequestItemRepository.delete({ materialRequestId: id });

    // Delete the request
    await this.materialRequestRepository.remove(request);
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


