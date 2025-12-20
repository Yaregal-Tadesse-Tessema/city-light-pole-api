import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { StockTransactionDto } from './dto/stock-transaction.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  async create(@Body() createDto: CreateInventoryItemDto, @Request() req: any) {
    return this.inventoryService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items with filters' })
  async findAll(@Query() queryDto: QueryInventoryDto) {
    return this.inventoryService.findAll(queryDto);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get all items with low stock' })
  async getLowStockItems() {
    return this.inventoryService.getLowStockItems();
  }

  @Post('check-availability')
  @ApiOperation({ summary: 'Check availability of multiple items' })
  async checkAvailability(@Body() checkDto: CheckAvailabilityDto) {
    return this.inventoryService.checkAvailability(checkDto);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get inventory item by code' })
  async findOne(@Param('code') code: string) {
    return this.inventoryService.findOne(code);
  }

  @Get(':code/transactions')
  @ApiOperation({ summary: 'Get transaction history for an item' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactionHistory(
    @Param('code') code: string,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getTransactionHistory(code, limit);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update inventory item' })
  async update(@Param('code') code: string, @Body() updateDto: UpdateInventoryItemDto) {
    return this.inventoryService.update(code, updateDto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete inventory item' })
  async remove(@Param('code') code: string) {
    await this.inventoryService.remove(code);
    return { message: 'Inventory item deleted successfully' };
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a stock transaction (IN, OUT, ADJUSTMENT)' })
  async createTransaction(@Body() transactionDto: StockTransactionDto, @Request() req: any) {
    return this.inventoryService.createTransaction(transactionDto, req.user.userId);
  }
}


