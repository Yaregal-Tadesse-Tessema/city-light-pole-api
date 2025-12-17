import { PartialType } from '@nestjs/swagger';
import { CreateFootballFieldDto } from './create-football-field.dto';

export class UpdateFootballFieldDto extends PartialType(CreateFootballFieldDto) {}


