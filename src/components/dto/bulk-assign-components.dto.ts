import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AssignComponentToPoleDto } from './assign-component-to-pole.dto';

export class BulkAssignComponentsDto {
  @ApiProperty({
    type: [AssignComponentToPoleDto],
    description: 'Array of component assignments',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignComponentToPoleDto)
  components: AssignComponentToPoleDto[];
}
