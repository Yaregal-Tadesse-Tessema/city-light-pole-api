import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';

async function seedAccidentUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🚨 Starting accident management users seed...');

  const userRepository = dataSource.getRepository(User);

  // Accident Management Users with proper roles
  const accidentUsers = [
    {
      email: 'inspector@city.gov',
      password: 'inspector123',
      fullName: 'John Inspector',
      phone: '+251911111111',
      role: UserRole.INSPECTOR,
      description: 'Field Inspector - performs damage assessments'
    },
    {
      email: 'supervisor@city.gov',
      password: 'supervisor123',
      fullName: 'Sarah Supervisor',
      phone: '+251922222222',
      role: UserRole.SUPERVISOR,
      description: 'Maintenance Supervisor - approves assessments'
    },
    {
      email: 'finance@city.gov',
      password: 'finance123',
      fullName: 'Mike Finance',
      phone: '+251933333333',
      role: UserRole.FINANCE,
      description: 'Finance Officer - validates costs and payments'
    },
    {
      email: 'accident-admin@city.gov',
      password: 'admin123',
      fullName: 'Accident Admin',
      phone: '+251944444444',
      role: UserRole.ADMIN,
      description: 'System Administrator - full access'
    }
  ];

  for (const userData of accidentUsers) {
    const existing = await userRepository.findOne({
      where: { email: userData.email }
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      await userRepository.save({
        email: userData.email,
        password: hashedPassword,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        status: UserStatus.ACTIVE,
      });

      console.log(`✅ Created ${userData.role}: ${userData.email} / ${userData.password}`);
      console.log(`   📝 ${userData.description}`);
      console.log('');
    } else {
      console.log(`⏭️  User ${userData.email} already exists`);
    }
  }

  console.log('🚨 Accident management users seed completed!');
  console.log('');
  console.log('📋 ACCIDENT MANAGEMENT WORKFLOW:');
  console.log('1. Inspector creates accident reports and performs damage assessments');
  console.log('2. Supervisor reviews and approves/rejects damage assessments');
  console.log('3. Finance validates cost estimates and processes payments');
  console.log('4. Admin has full access to all accident management features');
  console.log('');

  await app.close();
}

seedAccidentUsers().catch((error) => {
  console.error('❌ Accident users seed failed:', error);
  process.exit(1);
});

