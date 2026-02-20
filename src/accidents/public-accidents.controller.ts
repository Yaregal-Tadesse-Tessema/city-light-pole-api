import {
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { QueryAccidentsDto } from './dto/query-accidents.dto';

@ApiTags('Public Accidents')
@Controller('public/accidents')
export class PublicAccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create accident report (Public - No authentication required)' })
  @ApiResponse({ status: 201, description: 'Accident report created successfully' })
  create(@Body() createAccidentDto: CreateAccidentDto) {
    return this.accidentsService.createPublic(createAccidentDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all accident reports (Public - No authentication required)' })
  @ApiResponse({ status: 200, description: 'List of accident reports' })
  findAll(@Query() query: QueryAccidentsDto) {
    return this.accidentsService.findAll(query);
  }
}
