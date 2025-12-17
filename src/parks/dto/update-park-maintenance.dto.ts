import { PartialType } from '@nestjs/swagger';
import { CreateParkMaintenanceDto } from './create-park-maintenance.dto';

export class UpdateParkMaintenanceDto extends PartialType(CreateParkMaintenanceDto) {}

