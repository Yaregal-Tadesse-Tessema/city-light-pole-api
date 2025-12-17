import { PartialType } from '@nestjs/swagger';
import { CreateFootballFieldMaintenanceDto } from './create-football-field-maintenance.dto';

export class UpdateFootballFieldMaintenanceDto extends PartialType(CreateFootballFieldMaintenanceDto) {}

