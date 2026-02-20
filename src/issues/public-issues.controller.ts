import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CreateIssueDto } from './dto/create-issue.dto';
import { QueryIssuesDto } from './dto/query-issues.dto';
import { IssuesService } from './issues.service';

@ApiTags('Public Issues')
@Controller('public/issues')
export class PublicIssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Create issue without login',
    description: 'Public endpoint for issue submission.',
  })
  async create(@Body() createIssueDto: CreateIssueDto) {
    return this.issuesService.createPublic(createIssueDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all issues without login',
    description: 'Public endpoint for issues list with pagination and filters.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in description or pole code' })
  @ApiQuery({ name: 'status', required: false, enum: ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], description: 'Filter by status' })
  @ApiQuery({ name: 'severity', required: false, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'Filter by severity' })
  async findAll(@Query() queryDto: QueryIssuesDto) {
    return this.issuesService.findAll(queryDto);
  }
}
