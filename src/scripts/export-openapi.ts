import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../app.module';
import * as fs from 'fs/promises';
import * as path from 'path';

async function exportOpenAPI() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('City Light Pole Management API')
    .setDescription('API for managing city light poles, issues, and maintenance')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.join(process.cwd(), 'openapi.json');
  await fs.writeFile(outputPath, JSON.stringify(document, null, 2));

  console.log(`✅ OpenAPI schema exported to ${outputPath}`);

  await app.close();
}

exportOpenAPI().catch((error) => {
  console.error('❌ Export failed:', error);
  process.exit(1);
});


