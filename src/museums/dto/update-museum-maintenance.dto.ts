import { PartialType } from '@nestjs/swagger';
import { CreateMuseumMaintenanceDto } from './create-museum-maintenance.dto';

export class UpdateMuseumMaintenanceDto extends PartialType(CreateMuseumMaintenanceDto) {}

