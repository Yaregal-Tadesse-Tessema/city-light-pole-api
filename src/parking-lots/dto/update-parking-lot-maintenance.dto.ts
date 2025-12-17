import { PartialType } from '@nestjs/swagger';
import { CreateParkingLotMaintenanceDto } from './create-parking-lot-maintenance.dto';

export class UpdateParkingLotMaintenanceDto extends PartialType(CreateParkingLotMaintenanceDto) {}

