import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AccidentsService } from './accidents.service';
import { CreateAccidentDto } from './dto/create-accident.dto';
import { UpdateAccidentDto } from './dto/update-accident.dto';
import { QueryAccidentsDto } from './dto/query-accidents.dto';
import { ApproveAccidentDto } from './dto/approve-accident.dto';
import { AccidentType, ClaimStatus } from './enums/accident.enums';

@ApiTags('accidents')
@Controller('accidents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccidentsController {
  constructor(private readonly accidentsService: AccidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new accident report' })
  @ApiResponse({ status: 201, description: 'Accident report created successfully' })
  create(@Body() createAccidentDto: CreateAccidentDto, @CurrentUser() user: any) {
    return this.accidentsService.create(createAccidentDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all accident reports with filtering' })
  @ApiResponse({ status: 200, description: 'List of accident reports' })
  findAll(@Query() query: QueryAccidentsDto) {
    return this.accidentsService.findAll(query);
  }

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Get accident dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  getDashboardStats() {
    return this.accidentsService.getDashboardStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific accident report' })
  @ApiResponse({ status: 200, description: 'Accident report details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accidentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an accident report' })
  @ApiResponse({ status: 200, description: 'Accident report updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAccidentDto: UpdateAccidentDto,
    @CurrentUser() user: any,
  ) {
    console.log('🎯 Accident update for ID:', id, 'damageLevel:', updateAccidentDto.damageLevel);
    return this.accidentsService.update(id, updateAccidentDto, user.userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject an accident report' })
  @ApiResponse({ status: 200, description: 'Accident report approval processed' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() approveDto: ApproveAccidentDto,
    @CurrentUser() user: any,
  ) {
    console.log('🎯 Approve endpoint called for accident ID:', id, 'user:', user.userId, 'role:', user.role);
    console.log('🎯 Approve DTO:', approveDto);
    return this.accidentsService.approve(id, approveDto, user.userId, user.role);
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint to verify controller is working' })
  testEndpoint() {
    console.log('🎯 Test endpoint called');
    return { message: 'Accidents controller is working!', timestamp: new Date().toISOString() };
  }

  @Get('claim-test')
  @ApiOperation({ summary: 'Test claim status update endpoint' })
  testClaimEndpoint() {
    console.log('🎯 Claim test endpoint called');
    return { message: 'Claim status endpoint is accessible!', routes: ['PATCH /:id/status'] };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update accident status (including claims)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: { status?: string, claimStatus?: string },
    @CurrentUser() user: any,
  ) {
    console.log('🎯 Update status for accident:', id, 'dto:', updateDto);

    if (updateDto.claimStatus) {
      console.log('🎯 Updating claim status to:', updateDto.claimStatus);
      return this.accidentsService.updateClaimStatus(id, updateDto.claimStatus, user.userId);
    }

    // Handle regular status updates if needed
    return { message: 'Status update endpoint', received: updateDto };
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Upload photos for an accident report' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        description: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|mov|avi)$/)) {
        return callback(new BadRequestException('Only image and video files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  uploadPhotos(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('description') description?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file must be uploaded');
    }

    return Promise.all(
      files.map(file => this.accidentsService.addPhoto(id, file, description))
    );
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload attachments for an accident report' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        attachmentType: { type: 'string', enum: ['POLICE_REPORT', 'INSURANCE_CLAIM', 'OTHER'] },
        description: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5, {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(pdf|jpg|jpeg|png|doc|docx)$/)) {
        return callback(new BadRequestException('Only PDF, image, and document files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  uploadAttachments(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('attachmentType') attachmentType: string,
    @Body('description') description?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file must be uploaded');
    }

    if (!attachmentType) {
      throw new BadRequestException('Attachment type is required');
    }

    return Promise.all(
      files.map(file => this.accidentsService.addAttachment(id, file, attachmentType, description))
    );
  }

  @Delete('photos/:photoId')
  @ApiOperation({ summary: 'Remove a photo from an accident report' })
  @ApiResponse({ status: 200, description: 'Photo removed successfully' })
  removePhoto(@Param('photoId', ParseUUIDPipe) photoId: string, @CurrentUser() user: any) {
    return this.accidentsService.removePhoto(photoId, user.userId);
  }

  @Get(':id/reports/incident')
  @ApiOperation({ summary: 'Generate incident report PDF' })
  @ApiResponse({ status: 200, description: 'PDF report generated', content: { 'application/pdf': {} } })
  async generateIncidentReport(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const pdf = await this.accidentsService.generateIncidentReport(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=incident-report-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Get(':id/reports/damage-assessment')
  @ApiOperation({ summary: 'Generate damage assessment report PDF' })
  @ApiResponse({ status: 200, description: 'PDF report generated', content: { 'application/pdf': {} } })
  async generateDamageAssessmentReport(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const pdf = await this.accidentsService.generateDamageAssessmentReport(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=damage-assessment-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Get(':id/reports/cost-estimate')
  @ApiOperation({ summary: 'Generate cost estimate report PDF' })
  @ApiResponse({ status: 200, description: 'PDF report generated', content: { 'application/pdf': {} } })
  async generateCostEstimateReport(@Param('id', ParseUUIDPipe) id: string, @Res() res: any) {
    const pdf = await this.accidentsService.generateCostEstimateReport(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=cost-estimate-${id}.pdf`,
    });
    res.send(pdf);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an accident report' })
  @ApiResponse({ status: 200, description: 'Accident report deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.accidentsService.remove(id);
  }
}
