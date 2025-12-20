import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PurchaseRequestService } from './purchase-request.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { ReceivePurchaseRequestDto } from './dto/receive-purchase-request.dto';
import { PurchaseRequestStatus } from './entities/purchase-request.entity';

@ApiTags('Purchase Requests')
@ApiBearerAuth()
@Controller('purchase-requests')
@UseGuards(JwtAuthGuard)
export class PurchaseRequestController {
  constructor(private readonly purchaseRequestService: PurchaseRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase request' })
  async create(@Body() createDto: CreatePurchaseRequestDto, @Request() req: any) {
    return this.purchaseRequestService.create(createDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all purchase requests' })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseRequestStatus })
  async findAll(@Query('status') status?: PurchaseRequestStatus) {
    return this.purchaseRequestService.findAll({ status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase request by ID' })
  async findOne(@Param('id') id: string) {
    return this.purchaseRequestService.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject a purchase request' })
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApprovePurchaseRequestDto,
    @Request() req: any,
  ) {
    return this.purchaseRequestService.approve(id, approveDto, req.user.userId);
  }

  @Post(':id/order')
  @ApiOperation({ summary: 'Mark purchase request as ordered' })
  async markAsOrdered(@Param('id') id: string, @Request() req: any) {
    return this.purchaseRequestService.markAsOrdered(id, req.user.userId);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Mark purchase request as received and add to inventory' })
  async receive(
    @Param('id') id: string,
    @Body() receiveDto: ReceivePurchaseRequestDto,
    @Request() req: any,
  ) {
    return this.purchaseRequestService.receive(id, receiveDto, req.user.userId);
  }
}


