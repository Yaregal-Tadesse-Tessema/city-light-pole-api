import { PartialType } from '@nestjs/swagger';
import { CreatePublicToiletDto } from './create-public-toilet.dto';

export class UpdatePublicToiletDto extends PartialType(CreatePublicToiletDto) {}


