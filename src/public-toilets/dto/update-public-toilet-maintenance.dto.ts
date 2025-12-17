import { PartialType } from '@nestjs/swagger';
import { CreatePublicToiletMaintenanceDto } from './create-public-toilet-maintenance.dto';

export class UpdatePublicToiletMaintenanceDto extends PartialType(CreatePublicToiletMaintenanceDto) {}

