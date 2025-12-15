import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user', description: 'Authenticate user and receive JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Public signup', description: 'Create a new user account (public endpoint)' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      example: {
        id: 'uuid',
        email: 'user@example.com',
        fullName: 'John Doe',
        role: 'SUPERVISOR_VIEWER',
        status: 'ACTIVE',
        createdAt: '2025-01-20T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or user already exists' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register new user', description: 'Create a new user account (ADMIN only)' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully',
    schema: {
      example: {
        id: 'uuid',
        email: 'user@example.com',
        role: 'USER',
        createdAt: '2025-01-20T10:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error or user already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}


