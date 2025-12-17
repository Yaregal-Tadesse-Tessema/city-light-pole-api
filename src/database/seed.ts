import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { LightPole, PoleStatus, PoleType, LampType } from '../poles/entities/light-pole.entity';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seed...');

  // Seed Users
  const userRepository = dataSource.getRepository(User);
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const engineerPassword = await bcrypt.hash('engineer123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await userRepository.findOne({ where: { email: 'admin@city.gov' } });
  if (!admin) {
    await userRepository.save({
      email: 'admin@city.gov',
      password: adminPassword,
      fullName: 'Admin User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    console.log('✅ Created admin user: admin@city.gov / admin123');
  }

  const engineer = await userRepository.findOne({ where: { email: 'engineer@city.gov' } });
  if (!engineer) {
    await userRepository.save({
      email: 'engineer@city.gov',
      password: engineerPassword,
      fullName: 'Maintenance Engineer',
      phone: '+1234567891',
      role: UserRole.MAINTENANCE_ENGINEER,
      status: UserStatus.ACTIVE,
    });
    console.log('✅ Created engineer user: engineer@city.gov / engineer123');
  }

  const viewer = await userRepository.findOne({ where: { email: 'viewer@city.gov' } });
  if (!viewer) {
    await userRepository.save({
      email: 'viewer@city.gov',
      password: viewerPassword,
      fullName: 'Supervisor Viewer',
      phone: '+1234567892',
      role: UserRole.SUPERVISOR_VIEWER,
      status: UserStatus.ACTIVE,
    });
    console.log('✅ Created viewer user: viewer@city.gov / viewer123');
  }

  // Seed Light Poles
  const poleRepository = dataSource.getRepository(LightPole);
  const existingPoles = await poleRepository.count();
  
  if (existingPoles === 0) {
    const samplePoles = [
      {
        code: 'LP-001',
        district: 'Downtown',
        street: 'Main Street',
        gpsLat: 9.012345,
        gpsLng: 38.765432,
        poleType: PoleType.STANDARD,
        heightMeters: 8.5,
        lampType: LampType.LED,
        powerRatingWatt: 150,
        hasLedDisplay: false,
        status: PoleStatus.ACTIVE,
      },
      {
        code: 'LP-002',
        district: 'Downtown',
        street: 'Oak Avenue',
        gpsLat: 9.013456,
        gpsLng: 38.766543,
        poleType: PoleType.DECORATIVE,
        heightMeters: 10.0,
        lampType: LampType.LED,
        powerRatingWatt: 200,
        hasLedDisplay: true,
        ledModel: 'LED-3000',
        status: PoleStatus.OPERATIONAL,
      },
      {
        code: 'LP-003',
        district: 'Suburb',
        street: 'Elm Street',
        gpsLat: 9.014567,
        gpsLng: 38.767654,
        poleType: PoleType.STANDARD,
        heightMeters: 7.5,
        lampType: LampType.SODIUM,
        powerRatingWatt: 100,
        hasLedDisplay: false,
        status: PoleStatus.FAULT_DAMAGED,
      },
      {
        code: 'LP-004',
        district: 'Suburb',
        street: 'Maple Drive',
        gpsLat: 9.015678,
        gpsLng: 38.768765,
        poleType: PoleType.HIGH_MAST,
        heightMeters: 15.0,
        lampType: LampType.LED,
        powerRatingWatt: 300,
        hasLedDisplay: false,
        status: PoleStatus.UNDER_MAINTENANCE,
      },
      {
        code: 'LP-005',
        district: 'Downtown',
        street: 'Park Boulevard',
        gpsLat: 9.016789,
        gpsLng: 38.769876,
        poleType: PoleType.STANDARD,
        heightMeters: 9.0,
        lampType: LampType.LED,
        powerRatingWatt: 180,
        hasLedDisplay: true,
        ledModel: 'LED-2500',
        status: PoleStatus.ACTIVE,
      },
    ];

    await poleRepository.save(samplePoles);
    console.log(`✅ Created ${samplePoles.length} sample light poles`);
  }

  console.log('✅ Database seed completed!');
  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});



