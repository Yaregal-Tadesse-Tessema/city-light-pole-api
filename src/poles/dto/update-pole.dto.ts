import { PartialType } from '@nestjs/swagger';
import { CreatePoleDto } from './create-pole.dto';

export class UpdatePoleDto extends PartialType(CreatePoleDto) {}



