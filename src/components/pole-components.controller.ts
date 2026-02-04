import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PoleComponentsService } from './pole-components.service';
import { AssignComponentToPoleDto } from './dto/assign-component-to-pole.dto';
import { BulkAssignComponentsDto } from './dto/bulk-assign-components.dto';
import { UpdatePoleComponentStatusDto } from './dto/update-pole-component-status.dto';
import { ComponentStatus } from './enums/component.enums';

@ApiTags('Pole Components')
@Controller('poles/:poleCode/components')
export class PoleComponentsController {
  constructor(private readonly poleComponentsService: PoleComponentsService) {}

  @Post()
  @ApiOperation({ summary: 'Assign component(s) to pole' })
  @ApiParam({ name: 'poleCode', description: 'Light pole code' })
  async assignComponent(
    @Param('poleCode') poleCode: string,
    @Body() dto: AssignComponentToPoleDto,
  ) {
    return this.poleComponentsService.assignComponent(poleCode, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk assign components to pole' })
  @ApiParam({ name: 'poleCode', description: 'Light pole code' })
  async bulkAssignComponents(
    @Param('poleCode') poleCode: string,
    @Body() dto: BulkAssignComponentsDto,
  ) {
    return this.poleComponentsService.bulkAssignComponents(poleCode, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all components for a pole' })
  @ApiParam({ name: 'poleCode', description: 'Light pole code' })
  @ApiQuery({ name: 'status', required: false, enum: ComponentStatus })
  @ApiQuery({ name: 'includeRemoved', required: false, type: Boolean })
  async getPoleComponents(
    @Param('poleCode') poleCode: string,
    @Query('status') status?: ComponentStatus,
    @Query('includeRemoved') includeRemoved?: string,
  ) {
    return this.poleComponentsService.getPoleComponents(poleCode, {
      status,
      includeRemoved: includeRemoved === 'true',
    });
  }

  @Get(':componentId')
  @ApiOperation({ summary: 'Get specific component installation details' })
  @ApiParam({ name: 'poleCode', description: 'Light pole code' })
  @ApiParam({ name: 'componentId', description: 'Component UUID' })
  async getPoleComponent(
    @Param('poleCode') poleCode: string,
    @Param('componentId') componentId: string,
  ) {
    return this.poleComponentsService.getPoleComponent(poleCode, componentId);
  }

  @Patch(':componentId')
  @ApiOperation({ summary: 'Update component installation' })
  @ApiParam({ name: 'poleCode', description: 'Light pole code' })
  @ApiParam({ name: 'componentId', description: 'Component UUID' })
  async updatePoleComponent(
    @Param('poleCode') poleCode: string,
    @Param('componentId') componentId: string,
    @Body() dto: UpdatePoleComponentStatusDto,
  ) {
    return this.poleComponentsService.updatePoleComponent(
      poleCode,
      componentId,
      dto,
    );
  }

  @Delete(':componentId')
  @ApiOperation({ summary: 'Remove component from pole' })
  @ApiParam({ name: 'poleCode', description: 'Light pole code' })
  @ApiParam({ name: 'componentId', description: 'Component UUID' })
  @ApiQuery({ name: 'quantity', required: false, type: Number, description: 'Quantity for partial removal' })
  async removeComponent(
    @Param('poleCode') poleCode: string,
    @Param('componentId') componentId: string,
    @Query('quantity') quantity?: string,
  ) {
    const qty = quantity ? parseInt(quantity, 10) : undefined;
    return this.poleComponentsService.removeComponent(poleCode, componentId, qty);
  }
}
