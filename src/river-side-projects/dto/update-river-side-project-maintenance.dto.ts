import { PartialType } from '@nestjs/swagger';
import { CreateRiverSideProjectMaintenanceDto } from './create-river-side-project-maintenance.dto';

export class UpdateRiverSideProjectMaintenanceDto extends PartialType(CreateRiverSideProjectMaintenanceDto) {}

