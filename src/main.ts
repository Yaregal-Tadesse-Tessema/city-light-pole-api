import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get('PORT', 3011);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('City Light Pole Management API')
    .setDescription(
      'Comprehensive API for managing city light poles, tracking issues, scheduling maintenance, and generating reports. ' +
      'This API provides endpoints for authentication, user management, pole management, issue tracking, and maintenance operations.',
    )
    .setVersion('1.0')
    .setContact('City Light Pole Team', '', 'support@citylightpole.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(`http://localhost:${port}`, 'Development Server')
    .addServer('https://api.citylightpole.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('Authentication', 'User authentication and registration endpoints')
    .addTag('Users', 'User management and profile endpoints')
    .addTag('Poles', 'Light pole CRUD operations and management')
    .addTag('Issues', 'Issue reporting, tracking, and resolution')
    .addTag('Maintenance', 'Maintenance scheduling and logging')
    .addTag('Reports', 'Analytics and reporting endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'City Light Pole API Docs',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Serve OpenAPI JSON
  app.getHttpAdapter().get('/api/docs-json', (req, res) => {
    res.json(document);
  });

  await app.listen(port);

  console.log(`🚀 City Light Pole API running on port ${port}`);
  console.log(`📊 API available at: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
}
bootstrap();


