import { PartialType } from '@nestjs/swagger';
import { CreateDamagedComponentDto } from './create-damaged-component.dto';

export class UpdateDamagedComponentDto extends PartialType(CreateDamagedComponentDto) {}
