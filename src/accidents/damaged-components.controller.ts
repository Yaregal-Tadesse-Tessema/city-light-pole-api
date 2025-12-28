import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DamagedComponent, COST_ESTIMATION_TABLES } from './enums/accident.enums';

@ApiTags('damaged-components')
@Controller('damaged-components')
export class DamagedComponentsController {
  @Get()
  @ApiOperation({ summary: 'Get all available damaged component types with cost information' })
  @ApiResponse({
    status: 200,
    description: 'List of damaged components with their cost estimates',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'POLE' },
          name: { type: 'string', example: 'Pole' },
          costs: {
            type: 'object',
            properties: {
              MINOR: { type: 'number', example: 500 },
              MODERATE: { type: 'number', example: 1500 },
              SEVERE: { type: 'number', example: 3000 },
              TOTAL_LOSS: { type: 'number', example: 5000 },
            },
          },
        },
      },
    },
  })
  findAll() {
    const components = Object.values(DamagedComponent).map(component => {
      let costs;
      let name;

      if (component === DamagedComponent.POLE) {
        costs = COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD; // Default to standard pole costs
        name = 'Pole';
      } else {
        costs = COST_ESTIMATION_TABLES.COMPONENTS[component as keyof typeof COST_ESTIMATION_TABLES.COMPONENTS];
        name = component.charAt(0) + component.slice(1).toLowerCase().replace('_', ' ');
      }

      return {
        id: component,
        name,
        costs,
      };
    });

    return components;
  }
}
