import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('brevo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send email via Brevo' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendEmailViaBrevo(@Body() sendEmailDto: SendEmailDto) {
    return new Promise((resolve, reject) => {
      this.emailService.basicEmail(sendEmailDto, resolve, reject);
    });
  }

  // @Post('sendgrid')
  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Send email via SendGrid' })
  // @ApiResponse({ status: 200, description: 'Email sent successfully' })
  // @ApiResponse({ status: 400, description: 'Bad request' })
  // @ApiResponse({ status: 500, description: 'Internal server error' })
  // async sendEmailViaSendGrid(@Body() sendEmailDto: SendEmailDto) {
  //   return new Promise((resolve, reject) => {
  //     this.emailService.basicEmailOld(sendEmailDto, resolve, reject);
  //   });
  // }
}

