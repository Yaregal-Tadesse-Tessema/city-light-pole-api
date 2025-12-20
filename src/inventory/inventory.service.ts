import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction, TransactionType } from './entities/inventory-transaction.entity';
import { Category } from './entities/category.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CheckAvailabilityDto, ItemQuantityDto } from './dto/check-availability.dto';
import { StockTransactionDto } from './dto/stock-transaction.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private inventoryRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateInventoryItemDto, userId: string): Promise<InventoryItem> {
    // Check if code already exists
    const existing = await this.inventoryRepository.findOne({
      where: { code: createDto.code },
    });
    if (existing) {
      throw new BadRequestException(`Inventory item with code ${createDto.code} already exists`);
    }

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: createDto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${createDto.categoryId} not found`);
    }

    const item = this.inventoryRepository.create({
      ...createDto,
      category,
      currentStock: createDto.currentStock || 0,
      minimumThreshold: createDto.minimumThreshold || 0,
    });

    const savedItem = await this.inventoryRepository.save(item);

    // Create initial transaction if stock is provided
    if (createDto.currentStock && createDto.currentStock > 0) {
      await this.createTransaction({
        itemCode: savedItem.code,
        quantity: createDto.currentStock,
        type: TransactionType.IN,
        reference: 'INITIAL_STOCK',
        notes: 'Initial stock',
      }, userId);
    }

    return savedItem;
  }

  async findAll(queryDto: QueryInventoryDto) {
    const { page = 1, limit = 10, search, categoryId, lowStock, isActive } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.inventoryRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category');

    if (search) {
      queryBuilder.andWhere(
        '(item.name ILIKE :search OR item.code ILIKE :search OR item.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('item.categoryId = :categoryId', { categoryId });
    }

    if (lowStock !== undefined) {
      if (lowStock === 'low') {
        queryBuilder.andWhere('item.currentStock <= item.minimumThreshold');
      } else if (lowStock === 'warning') {
        queryBuilder.andWhere('item.currentStock > item.minimumThreshold AND item.currentStock <= item.minimumThreshold * 1.5');
      } else if (lowStock === 'in_stock') {
        queryBuilder.andWhere('item.currentStock > item.minimumThreshold * 1.5');
      }
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('item.isActive = :isActive', { isActive });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('item.name', 'ASC')
      .getManyAndCount();

    return {
      page,
      limit,
      total,
      items,
    };
  }

  async findOne(code: string): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({
      where: { code },
      relations: ['category', 'transactions', 'transactions.user'],
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with code ${code} not found`);
    }

    return item;
  }

  async update(code: string, updateDto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOne(code);
    
    // If categoryId is being updated, verify it exists
    if (updateDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${updateDto.categoryId} not found`);
      }
      item.category = category;
      item.categoryId = updateDto.categoryId;
    }
    
    // Update other fields
    const { categoryId, ...otherFields } = updateDto;
    Object.assign(item, otherFields);
    
    return this.inventoryRepository.save(item);
  }

  async remove(code: string): Promise<void> {
    const item = await this.findOne(code);
    await this.inventoryRepository.remove(item);
  }

  async checkAvailability(checkDto: CheckAvailabilityDto) {
    const results = [];

    for (const itemRequest of checkDto.items) {
      const item = await this.inventoryRepository.findOne({
        where: { code: itemRequest.itemCode },
      });

      if (!item) {
        results.push({
          itemCode: itemRequest.itemCode,
          available: false,
          availableQuantity: 0,
          requestedQuantity: itemRequest.quantity,
          needsPurchase: true,
          error: 'Item not found',
        });
        continue;
      }

      const available = item.currentStock >= itemRequest.quantity;
      const availableQuantity = item.currentStock;

      results.push({
        itemCode: itemRequest.itemCode,
        itemName: item.name,
        available,
        availableQuantity,
        requestedQuantity: itemRequest.quantity,
        needsPurchase: !available,
        remainingAfterUse: available ? item.currentStock - itemRequest.quantity : item.currentStock,
      });
    }

    return results;
  }

  async createTransaction(
    transactionDto: StockTransactionDto,
    userId: string,
  ): Promise<InventoryTransaction> {
    const item = await this.findOne(transactionDto.itemCode);

    const stockBefore = item.currentStock;
    let stockAfter = stockBefore;

    if (transactionDto.type === TransactionType.IN || transactionDto.type === TransactionType.PURCHASE) {
      stockAfter = stockBefore + transactionDto.quantity;
    } else if (
      transactionDto.type === TransactionType.OUT ||
      transactionDto.type === TransactionType.USAGE
    ) {
      if (stockBefore < transactionDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${stockBefore}, Requested: ${transactionDto.quantity}`,
        );
      }
      stockAfter = stockBefore - transactionDto.quantity;
    } else if (transactionDto.type === TransactionType.ADJUSTMENT) {
      stockAfter = transactionDto.quantity;
    }

    // Update item stock
    item.currentStock = stockAfter;
    await this.inventoryRepository.save(item);

    // Check for low stock and send notification
    if (stockAfter <= item.minimumThreshold && stockBefore > item.minimumThreshold) {
      await this.notificationsService.notifyLowStock(
        item.code,
        item.name,
        stockAfter,
        item.minimumThreshold,
      );
    }

    // Create transaction record
    const transaction = this.transactionRepository.create({
      itemCode: transactionDto.itemCode,
      type: transactionDto.type,
      quantity: transactionDto.quantity,
      stockBefore,
      stockAfter,
      userId,
      reference: transactionDto.reference,
      notes: transactionDto.notes,
    });

    return this.transactionRepository.save(transaction);
  }

  async getLowStockItems() {
    return this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.currentStock <= item.minimumThreshold')
      .andWhere('item.isActive = :isActive', { isActive: true })
      .orderBy('item.currentStock', 'ASC')
      .getMany();
  }

  async getTransactionHistory(itemCode: string, limit = 50) {
    return this.transactionRepository.find({
      where: { itemCode },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}


