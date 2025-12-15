import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'PORT',
  'PUBLIC_BASE_URL',
];

function validateEnv() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
  }

  require('dotenv').config();

  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log('✅ Environment variables validated');
}

function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    execSync('npm run migration:run', { stdio: 'inherit' });
    console.log('✅ Migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

function runSeed() {
  console.log('🌱 Running seed script...');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
    console.log('✅ Seed completed');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

function startDev() {
  console.log('🚀 Starting API in watch mode...');
  try {
    execSync('npm run start:dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🏃 Starting dev-run script...\n');

  validateEnv();
  runMigrations();
  runSeed();
  startDev();
}

main();


