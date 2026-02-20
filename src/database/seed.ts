import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { LightPole, PoleStatus, PoleType, LampType } from '../poles/entities/light-pole.entity';
import { Category } from '../inventory/entities/category.entity';
import { InventoryItem, UnitOfMeasure } from '../inventory/entities/inventory-item.entity';
import { InventoryTransaction, TransactionType } from '../inventory/entities/inventory-transaction.entity';
import { MaterialRequest, MaterialRequestStatus } from '../inventory/entities/material-request.entity';
import { MaterialRequestItem, RequestItemStatus, RequestItemType } from '../inventory/entities/material-request-item.entity';
import { PurchaseRequest, PurchaseRequestStatus } from '../inventory/entities/purchase-request.entity';
import { PurchaseRequestItem } from '../inventory/entities/purchase-request-item.entity';
import { PoleIssue, IssueStatus } from '../issues/entities/pole-issue.entity';
import { MaintenanceSchedule, ScheduleStatus } from '../maintenance/entities/maintenance-schedule.entity';
import { Role, SystemRole } from '../roles/entities/role.entity';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 Starting database seed...');

  // Add SYSTEM_ADMIN to enum if it doesn't exist
  try {
    await dataSource.query(`
      ALTER TYPE "public"."users_role_enum"
      ADD VALUE IF NOT EXISTS 'SYSTEM_ADMIN'
    `);
    console.log('✅ Added SYSTEM_ADMIN to users_role_enum');
  } catch (error) {
    // Enum value might already exist, ignore error
    console.log('ℹ️  SYSTEM_ADMIN enum value check completed');
  }

  // Seed Users - Create users for ADMIN, SYSTEM_ADMIN, MAINTENANCE_ENGINEER, and SUPERVISOR_VIEWER roles
  const userRepository = dataSource.getRepository(User);
  
  const usersToSeed = [
    {
      email: 'admin@city.gov',
      password: 'admin123',
      fullName: 'Admin User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
    },
    {
      email: 'system-admin@city.gov',
      password: 'systemadmin123',
      fullName: 'System Administrator',
      phone: '+1234567891',
      role: UserRole.SYSTEM_ADMIN,
    },
    {
      email: 'engineer@city.gov',
      password: 'engineer123',
      fullName: 'Maintenance Engineer',
      phone: '+1234567892',
      role: UserRole.MAINTENANCE_ENGINEER,
    },
    {
      email: 'viewer@city.gov',
      password: 'viewer123',
      fullName: 'Supervisor Viewer',
      phone: '+1234567893',
      role: UserRole.SUPERVISOR_VIEWER,
    },
  ];

  console.log('\n👥 Seeding users for all roles...\n');
  
  for (const userData of usersToSeed) {
    const existing = await userRepository.findOne({ where: { email: userData.email } });
    
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
    } else {
      console.log(`⏭️  User ${userData.email} already exists`);
    }
  }
  
  console.log('\n📋 All seeded user credentials:\n');
  usersToSeed.forEach(user => {
    console.log(`   ${user.role.padEnd(25)} - Email: ${user.email.padEnd(25)} Password: ${user.password}`);
  });
  console.log('');

  // Seed Roles
  const roleRepository = dataSource.getRepository(Role);
  const defaultRoles = [
    {
      name: SystemRole.ADMIN,
      displayName: 'Administrator',
      description: 'Full system access and user management',
    },
    {
      name: SystemRole.INVENTORY_MANAGER,
      displayName: 'Inventory Manager',
      description: 'Manages inventory items and receives low stock alerts',
    },
    {
      name: SystemRole.MAINTENANCE_MANAGER,
      displayName: 'Maintenance Manager',
      description: 'Manages maintenance schedules and receives maintenance notifications',
    },
    {
      name: SystemRole.ISSUE_MANAGER,
      displayName: 'Issue Manager',
      description: 'Handles reported issues and receives issue notifications',
    },
    {
      name: SystemRole.PURCHASE_MANAGER,
      displayName: 'Purchase Manager',
      description: 'Manages purchase requests and receives completion notifications',
    },
    {
      name: SystemRole.OPERATOR,
      displayName: 'Operator',
      description: 'General operations access',
    },
  ];

  for (const roleData of defaultRoles) {
    const existing = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!existing) {
      await roleRepository.save(roleData);
      console.log(`✅ Created role: ${roleData.displayName}`);
    }
  }

  // Seed Categories
  const categoryRepository = dataSource.getRepository(Category);
  const defaultCategories = [
    { name: 'Light Bulbs', description: 'Various types of light bulbs' },
    { name: 'Wiring', description: 'Electrical wiring and cables' },
    { name: 'Tools', description: 'Maintenance tools and equipment' },
    { name: 'Hardware', description: 'Hardware components and fixtures' },
    { name: 'Electrical Components', description: 'Electrical components and parts' },
    { name: 'Other', description: 'Other inventory items' },
  ];

  for (const catData of defaultCategories) {
    const existing = await categoryRepository.findOne({ where: { name: catData.name } });
    if (!existing) {
      await categoryRepository.save(catData);
      console.log(`✅ Created category: ${catData.name}`);
    }
  }

  // Seed Light Poles
  const poleRepository = dataSource.getRepository(LightPole);
  const existingPoles = await poleRepository.count();
  
  if (existingPoles === 0 || existingPoles < 1500) { // Allow reseeding if less than 1500 poles
    console.log('🌱 Generating comprehensive pole dataset...');

    // Addis Ababa subcities (matching the Subcity enum) and their approximate coordinate ranges
    const subcities = [
      { name: 'Bole', latRange: [9.000, 9.020], lngRange: [38.750, 38.820] },
      { name: 'Arada', latRange: [9.025, 9.045], lngRange: [38.720, 38.750] },
      { name: 'Kirkos', latRange: [9.000, 9.020], lngRange: [38.720, 38.750] },
      { name: 'Lideta', latRange: [9.005, 9.025], lngRange: [38.720, 38.750] },
      { name: 'Kolfe Keranio', latRange: [9.000, 9.015], lngRange: [38.680, 38.720] },
      { name: 'Nifas Silk-Lafto', latRange: [8.950, 9.010], lngRange: [38.680, 38.720] },
      { name: 'Akaky Kaliti', latRange: [8.850, 8.950], lngRange: [38.750, 38.800] },
      { name: 'Gullele', latRange: [9.020, 9.040], lngRange: [38.700, 38.730] },
      { name: 'Yeka', latRange: [9.050, 9.070], lngRange: [38.750, 38.800] },
      { name: 'Addis Ketema', latRange: [9.030, 9.050], lngRange: [38.680, 38.720] },
      { name: 'Lemi Kura', latRange: [8.950, 9.000], lngRange: [38.700, 38.750] },
    ];

    // Additional streets to expand variety
    const additionalStreets = [
      'Entoto Hill Road', 'Shiromeda Road', 'Gotera Road', 'Lancha Road', 'Kera Road',
      'Ayer Tena Road', 'Figa Road', 'Chechela Road', 'Bole Bulbula Road', 'Wollo Sefer Road',
      'Addis Ketema Road', 'Entoto Avenue', 'Shiromeda Avenue', 'Gotera Avenue', 'Lancha Avenue',
      'Kera Avenue', 'Ayer Tena Avenue', 'Figa Avenue', 'Chechela Avenue', 'Bole Bulbula Avenue',
      'Entoto Street', 'Shiromeda Street', 'Gotera Street', 'Lancha Street', 'Kera Street',
      'Ayer Tena Street', 'Figa Street', 'Chechela Street', 'Bole Bulbula Street'
    ];

    // Street names commonly found in Addis Ababa
    const streetNames = [
      'Africa Avenue', 'Kenya Street', 'Ghana Street', 'Sudan Street', 'Egypt Street',
      'Algeria Street', 'Tunisia Street', 'Morocco Street', 'Libya Street', 'Senegal Street',
      'Mali Street', 'Niger Street', 'Nigeria Street', 'Ghana Avenue', 'Benin Street',
      'Togo Street', 'Cameroon Street', 'Chad Street', 'Congo Street', 'Gabon Street',
      'Central African Republic Street', 'South Africa Street', 'Sierra Leone Street',
      'Liberia Street', 'Ivory Coast Street', 'Guinea Street', 'Ethiopia Street',
      'King George VI Street', 'Ras Desta Damtew Avenue', 'Ras Mekonnen Avenue',
      'Ras Abebe Aregay Street', 'Dejazmach Balcha Abanefso Street', 'King George VI Street',
      'Queen Elizabeth II Street', 'Mahatma Gandhi Street', 'Sylvia Pankhurst Street',
      'Jomo Kenyatta Avenue', 'Patrice Lumumba Street', 'Nelson Mandela Avenue',
      'Julius Nyerere Street', 'Samora Machel Street', 'Kwame Nkrumah Street',
      'Ahmed Sekou Toure Street', 'Gamal Abdel Nasser Street', 'Jawaharlal Nehru Street',
      'Alexander Pushkin Avenue', 'Cunningham Street', 'Smuts Avenue', 'Hachalu Hundessa Road',
      'Haile Gebreselassie Avenue', 'Sahle Selassie Street', 'Yohannes IV Street',
      'Tewodros II Street', 'Menelik I Street', 'Atse Yohannes Street', 'Atse Tewodros Street',
      'Atse Menelik Street', 'Atse Haile Selassie Street', 'Adwa Street', 'Alula Aba Nega Street',
      'Aba Kiros Street', 'Aba Samuel Road', 'Debre Zeit Road', 'Jimma Road', 'Ambo Road',
      'Dessie Road', 'Gojjam Berenda Road', 'Sidamo Road', 'Wolaita Road', 'Arsi Road',
      'Bale Road', 'Borena Road', 'Harar Road', 'Wollo Sefer Road', 'Mekelle Road',
      'Gondar Road', 'Bahir Dar Road', 'Dire Dawa Road', 'Assab Road', 'Djibouti Road',
      '20 Meter Road', '22 Meter Road', '30 Meter Road', '40 Meter Road', 'Ring Road',
      'CMC Road', 'Megenagna Road', 'Summit Road', 'Salite Mihret Road', 'Yeka Road',
      'Kotebe Road', 'Ayat Road', 'Gurd Shola Road', 'Mexico Square Road', 'Meskel Square Road',
      'Saris Road', 'Kaliti Road', 'Akaki Road', 'Tor Hailoch Road', 'Asko Road',
      'Shiro Meda Road', 'Entoto Road', 'CMC Road'
    ];

    // LED models for variety

    // Generate 5000 poles across Addis Ababa for extensive testing
    const samplePoles = [];
    const totalPoles = 5000;

    for (let i = 1; i <= totalPoles; i++) {
      // Select random subcity
      const subcity = subcities[Math.floor(Math.random() * subcities.length)];

      // Generate random coordinates within subcity bounds
      const lat = subcity.latRange[0] + Math.random() * (subcity.latRange[1] - subcity.latRange[0]);
      const lng = subcity.lngRange[0] + Math.random() * (subcity.lngRange[1] - subcity.lngRange[0]);

      // Select random street (combine main and additional streets)
      const allStreets = [...streetNames, ...additionalStreets];
      const street = allStreets[Math.floor(Math.random() * allStreets.length)];

      // Random pole type
      const poleTypes = [PoleType.STANDARD, PoleType.DECORATIVE, PoleType.HIGH_MAST];
      const poleType = poleTypes[Math.floor(Math.random() * poleTypes.length)];

      // Random lamp type
      const lampTypes = [LampType.LED, LampType.SODIUM, LampType.HALOGEN];
      const lampType = lampTypes[Math.floor(Math.random() * lampTypes.length)];

      // Random height based on pole type
      let heightMeters: number;
      switch (poleType) {
        case PoleType.HIGH_MAST:
          heightMeters = 12 + Math.random() * 8; // 12-20m
          break;
        case PoleType.DECORATIVE:
          heightMeters = 8 + Math.random() * 4; // 8-12m
          break;
        default:
          heightMeters = 6 + Math.random() * 4; // 6-10m
      }

      // Random power rating based on lamp type
      let powerRatingWatt: number;
      switch (lampType) {
        case LampType.LED:
          powerRatingWatt = 50 + Math.floor(Math.random() * 151); // 50-200W
          break;
        case LampType.SODIUM:
          powerRatingWatt = 100 + Math.floor(Math.random() * 201); // 100-300W
          break;
        default:
          powerRatingWatt = 200 + Math.floor(Math.random() * 301); // 200-500W
      }

      // Random status distribution
      const statusRand = Math.random();
      let status: PoleStatus;
      if (statusRand < 0.7) {
        status = PoleStatus.OPERATIONAL; // 70% operational
      } else if (statusRand < 0.85) {
        status = PoleStatus.UNDER_MAINTENANCE; // 15% under maintenance
      } else {
        status = PoleStatus.FAULT_DAMAGED; // 15% fault/damaged
      }

      // Create pole object
      const poleData: any = {
        code: `LP-${String(i).padStart(3, '0')}`,
        subcity: subcity.name,
        street: street,
        gpsLat: lat,
        gpsLng: lng,
        poleType: poleType,
        heightMeters: Math.round(heightMeters * 10) / 10, // Round to 1 decimal
        lampType: lampType,
        powerRatingWatt: powerRatingWatt,
        status: status,
        numberOfPoles: Math.floor(Math.random() * 4) + 1, // 1-4 poles
        poleInstallationDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      };

      samplePoles.push(poleData);
    }

    // Save all poles in batches to avoid memory issues
    const batchSize = 200; // Larger batches for better performance with 5000 poles
    for (let i = 0; i < samplePoles.length; i += batchSize) {
      const batch = samplePoles.slice(i, i + batchSize);
      await poleRepository.save(batch);
      console.log(`✅ Saved poles ${i + 1}-${Math.min(i + batchSize, samplePoles.length)}`);
    }

    console.log(`✅ Created ${totalPoles} comprehensive light poles across Addis Ababa`);
    console.log(`   📍 Distributed across ${subcities.length} subcities`);
    console.log(`   🟢 ~${Math.round(totalPoles * 0.7)} operational`);
    console.log(`   🟠 ~${Math.round(totalPoles * 0.15)} under maintenance`);
    console.log(`   🔴 ~${Math.round(totalPoles * 0.15)} fault/damaged`);
  }

  // Seed Inventory Items
  const inventoryRepository = dataSource.getRepository(InventoryItem);
  const existingInventoryItems = await inventoryRepository.count();

  if (existingInventoryItems < 50) { // Allow reseeding if less than 50 items
    console.log('🌱 Generating comprehensive inventory items...');

    // Get all categories for reference
    const categories = await categoryRepository.find();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));

    // Comprehensive inventory items for each category
    const inventoryData = [
      // Light Bulbs
      { name: 'LED Bulb 50W', code: 'LB-001', categoryId: categoryMap.get('Light Bulbs'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 250, minimumThreshold: 50, unitCost: 5.50 },
      { name: 'LED Bulb 100W', code: 'LB-002', categoryId: categoryMap.get('Light Bulbs'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 180, minimumThreshold: 40, unitCost: 8.75 },
      { name: 'LED Bulb 150W', code: 'LB-003', categoryId: categoryMap.get('Light Bulbs'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 120, minimumThreshold: 30, unitCost: 12.00 },
      { name: 'Sodium Bulb 250W', code: 'LB-004', categoryId: categoryMap.get('Light Bulbs'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 85, minimumThreshold: 25, unitCost: 18.50 },
      { name: 'Halogen Bulb 500W', code: 'LB-005', categoryId: categoryMap.get('Light Bulbs'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 45, minimumThreshold: 15, unitCost: 25.00 },
      { name: 'LED Street Light Module', code: 'LB-006', categoryId: categoryMap.get('Light Bulbs'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 75, minimumThreshold: 20, unitCost: 45.00 },

      // Wiring
      { name: 'Copper Wire 2.5mm', code: 'WR-001', categoryId: categoryMap.get('Wiring'), unitOfMeasure: UnitOfMeasure.METERS, currentStock: 500, minimumThreshold: 100, unitCost: 2.25 },
      { name: 'Copper Wire 4mm', code: 'WR-002', categoryId: categoryMap.get('Wiring'), unitOfMeasure: UnitOfMeasure.METERS, currentStock: 350, minimumThreshold: 80, unitCost: 3.50 },
      { name: 'Copper Wire 6mm', code: 'WR-003', categoryId: categoryMap.get('Wiring'), unitOfMeasure: UnitOfMeasure.METERS, currentStock: 200, minimumThreshold: 50, unitCost: 5.75 },
      { name: 'Electrical Cable 3-Core', code: 'WR-004', categoryId: categoryMap.get('Wiring'), unitOfMeasure: UnitOfMeasure.METERS, currentStock: 150, minimumThreshold: 40, unitCost: 8.90 },
      { name: 'Ground Wire', code: 'WR-005', categoryId: categoryMap.get('Wiring'), unitOfMeasure: UnitOfMeasure.METERS, currentStock: 300, minimumThreshold: 75, unitCost: 1.80 },

      // Tools
      { name: 'Wire Cutter 8"', code: 'TL-001', categoryId: categoryMap.get('Tools'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 25, minimumThreshold: 5, unitCost: 15.00 },
      { name: 'Screwdriver Set', code: 'TL-002', categoryId: categoryMap.get('Tools'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 18, minimumThreshold: 4, unitCost: 22.50 },
      { name: 'Multimeter Digital', code: 'TL-003', categoryId: categoryMap.get('Tools'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 12, minimumThreshold: 3, unitCost: 35.00 },
      { name: 'Voltage Tester', code: 'TL-004', categoryId: categoryMap.get('Tools'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 20, minimumThreshold: 5, unitCost: 8.75 },
      { name: 'Ladder 6ft', code: 'TL-005', categoryId: categoryMap.get('Tools'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 8, minimumThreshold: 2, unitCost: 45.00 },
      { name: 'Safety Harness', code: 'TL-006', categoryId: categoryMap.get('Tools'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 15, minimumThreshold: 4, unitCost: 28.00 },

      // Hardware
      { name: 'Steel Pole Bracket', code: 'HW-001', categoryId: categoryMap.get('Hardware'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 60, minimumThreshold: 15, unitCost: 12.50 },
      { name: 'Mounting Plate', code: 'HW-002', categoryId: categoryMap.get('Hardware'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 45, minimumThreshold: 12, unitCost: 8.90 },
      { name: 'Cable Clips (Pack of 100)', code: 'HW-003', categoryId: categoryMap.get('Hardware'), unitOfMeasure: UnitOfMeasure.BOXES, currentStock: 30, minimumThreshold: 8, unitCost: 15.00 },
      { name: 'Ground Rod 2m', code: 'HW-004', categoryId: categoryMap.get('Hardware'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 40, minimumThreshold: 10, unitCost: 18.50 },
      { name: 'Conduit Pipe 20mm', code: 'HW-005', categoryId: categoryMap.get('Hardware'), unitOfMeasure: UnitOfMeasure.METERS, currentStock: 120, minimumThreshold: 30, unitCost: 3.25 },

      // Electrical Components
      { name: 'Circuit Breaker 10A', code: 'EC-001', categoryId: categoryMap.get('Electrical Components'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 35, minimumThreshold: 8, unitCost: 7.50 },
      { name: 'Junction Box', code: 'EC-002', categoryId: categoryMap.get('Electrical Components'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 28, minimumThreshold: 7, unitCost: 4.25 },
      { name: 'Timer Switch', code: 'EC-003', categoryId: categoryMap.get('Electrical Components'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 22, minimumThreshold: 5, unitCost: 12.00 },
      { name: 'Photo Sensor', code: 'EC-004', categoryId: categoryMap.get('Electrical Components'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 16, minimumThreshold: 4, unitCost: 18.75 },
      { name: 'Power Supply 12V', code: 'EC-005', categoryId: categoryMap.get('Electrical Components'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 14, minimumThreshold: 3, unitCost: 25.00 },

      // Other
      { name: 'Cleaning Cloth (Pack)', code: 'OT-001', categoryId: categoryMap.get('Other'), unitOfMeasure: UnitOfMeasure.BOXES, currentStock: 50, minimumThreshold: 12, unitCost: 3.50 },
      { name: 'Safety Gloves', code: 'OT-002', categoryId: categoryMap.get('Other'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 75, minimumThreshold: 18, unitCost: 2.25 },
      { name: 'Warning Tape', code: 'OT-003', categoryId: categoryMap.get('Other'), unitOfMeasure: UnitOfMeasure.PIECES, currentStock: 40, minimumThreshold: 10, unitCost: 4.75 },
    ];

    await inventoryRepository.save(inventoryData);
    console.log(`✅ Created ${inventoryData.length} comprehensive inventory items`);
  }

  /*
  // Seed Material Requests - Temporarily disabled due to TypeScript errors
  const materialRequestRepository = dataSource.getRepository(MaterialRequest);
  const materialRequestItemRepository = dataSource.getRepository(MaterialRequestItem);
  const existingMaterialRequests = await materialRequestRepository.count();

  if (existingMaterialRequests < 20) { // Allow reseeding if less than 20 requests
    console.log('🌱 Generating material requests...');

    const maintenanceSchedules = await dataSource.getRepository(MaintenanceSchedule).find({ take: 20 });
    const inventoryItems = await inventoryRepository.find({ take: 50 });

    // Create 15 material requests
    for (let i = 1; i <= 15; i++) {
      const engineer = await userRepository.findOne({ where: { role: UserRole.MAINTENANCE_ENGINEER } });
      const admin = await userRepository.findOne({ where: { role: UserRole.ADMIN } });
      const schedule = maintenanceSchedules[i % maintenanceSchedules.length];

      const materialRequest = await materialRequestRepository.save({
        requestedById: engineer?.id || admin?.id,
        maintenanceScheduleId: schedule?.id,
        status: i <= 8 ? MaterialRequestStatus.APPROVED : i <= 12 ? MaterialRequestStatus.PENDING : MaterialRequestStatus.REJECTED,
        notes: `Material request for maintenance ${i}`,
        requestedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      });

      // Add 2-4 items per request
      const itemCount = Math.floor(Math.random() * 3) + 2;
      for (let j = 0; j < itemCount; j++) {
        const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
        await materialRequestItemRepository.save({
          materialRequestId: materialRequest.id,
          inventoryItemCode: item.code,
          requestedQuantity: Math.floor(Math.random() * 10) + 1,
          availableQuantity: Math.min(item.currentStock, Math.floor(Math.random() * 20) + 1),
          requestType: Math.random() < 0.7 ? 'USAGE' : 'PURCHASE',
          status: RequestItemStatus.PENDING,
          notes: `Item ${j + 1} for request ${i}`,
        });
      }
    }

    console.log('✅ Created 15 material requests with items');
  }
  */

  /*
  // Seed Purchase Requests - Temporarily disabled due to TypeScript errors
  const purchaseRequestRepository = dataSource.getRepository(PurchaseRequest);
  const purchaseRequestItemRepository = dataSource.getRepository(PurchaseRequestItem);
  const existingPurchaseRequests = await purchaseRequestRepository.count();

  if (existingPurchaseRequests < 15) { // Allow reseeding if less than 15 requests
    console.log('🌱 Generating purchase requests...');

    const suppliers = ['ABC Electrical Supplies', 'Addis Power Corp', 'Ethio Lighting Ltd', 'Global Hardware Inc', 'Local Electrical Store'];
    const inventoryItems = await inventoryRepository.find();

    // Create 12 purchase requests
    for (let i = 1; i <= 12; i++) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const engineer = await userRepository.findOne({ where: { role: UserRole.MAINTENANCE_ENGINEER } });
      const admin = await userRepository.findOne({ where: { role: UserRole.ADMIN } });

      const purchaseRequest = await purchaseRequestRepository.save({
        supplierName: supplier,
        requestedById: engineer?.id || admin?.id,
        status: i <= 6 ? PurchaseRequestStatus.RECEIVED : i <= 9 ? PurchaseRequestStatus.APPROVED : PurchaseRequestStatus.PENDING,
        totalCost: 0, // Will be calculated
        notes: `Purchase request ${i} from ${supplier}`,
        deliveryDate: i <= 6 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
        requestedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      });

      // Add items to purchase request
      const itemCount = Math.floor(Math.random() * 4) + 2;
      let totalCost = 0;

      for (let j = 0; j < itemCount; j++) {
        const item = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
        const quantity = Math.floor(Math.random() * 50) + 10;
        const unitCost = item.unitCost;
        const lineTotal = quantity * unitCost;

        await purchaseRequestItemRepository.save({
          purchaseRequestId: purchaseRequest.id,
          inventoryItemCode: item.code,
          requestedQuantity: quantity,
          unitCost: unitCost,
          totalCost: lineTotal,
        });

        totalCost += lineTotal;
      }

      // Update total cost
      await purchaseRequestRepository.update(purchaseRequest.id, { totalCost });
    }

    console.log('✅ Created 12 purchase requests with items');
  }
  */

  // Seed Issues
  const issueRepository = dataSource.getRepository(PoleIssue);
  const existingIssues = await issueRepository.count();

  if (existingIssues < 60) { // Allow reseeding if less than 60 issues
    console.log('🌱 Generating pole issues...');

    const poles = await poleRepository.find({ take: 100 }); // Get first 100 poles

    // Create 50 issues
    for (let i = 1; i <= 50; i++) {
      const pole = poles[Math.floor(Math.random() * poles.length)];
      const engineer = await userRepository.findOne({ where: { role: UserRole.MAINTENANCE_ENGINEER } });
      const admin = await userRepository.findOne({ where: { role: UserRole.ADMIN } });

      const issueTypes = ['Bulb burnt out', 'Wiring fault', 'Pole damage', 'Power outage', 'LED display malfunction', 'Camera not working', 'Phone charger broken'];
      const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];

      await issueRepository.save({
        poleCode: pole.code,
        reportedById: engineer?.id || admin?.id,
        description: `${issueType} on pole ${pole.code}`,
        status: i <= 25 ? IssueStatus.RESOLVED : i <= 40 ? IssueStatus.IN_PROGRESS : IssueStatus.REPORTED,
        priority: Math.random() < 0.7 ? 'MEDIUM' : Math.random() < 0.9 ? 'HIGH' : 'LOW',
        location: `${pole.subcity}, ${pole.street}`,
        reportedDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        resolvedDate: i <= 25 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
      });
    }

    console.log('✅ Created 50 pole issues');
  }

  /*
  // Seed Maintenance Schedules - Temporarily disabled due to TypeScript errors
  const maintenanceRepository = dataSource.getRepository(MaintenanceSchedule);
  const existingSchedules = await maintenanceRepository.count();

  if (existingSchedules < 35) { // Allow reseeding if less than 35 schedules
    console.log('🌱 Generating maintenance schedules...');

    const poles = await poleRepository.find({ take: 200 }); // Get first 200 poles

    // Create 30 maintenance schedules
    for (let i = 1; i <= 30; i++) {
      const pole = poles[Math.floor(Math.random() * poles.length)];
      const engineer = await userRepository.findOne({ where: { role: UserRole.MAINTENANCE_ENGINEER } });
      const admin = await userRepository.findOne({ where: { role: UserRole.ADMIN } });

      const maintenanceTypes = ['Routine inspection', 'Bulb replacement', 'Wiring check', 'Cleaning', 'LED maintenance', 'Camera inspection'];
      const maintenanceType = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];

      await maintenanceRepository.save({
        poleCode: pole.code,
        description: `${maintenanceType} for pole ${pole.code}`,
        scheduledDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        status: i <= 15 ? ScheduleStatus.COMPLETED : i <= 22 ? ScheduleStatus.STARTED : ScheduleStatus.REQUESTED,
        priority: Math.random() < 0.6 ? 'MEDIUM' : Math.random() < 0.8 ? 'LOW' : 'HIGH',
        assignedToId: engineer?.id || admin?.id,
        estimatedDuration: Math.floor(Math.random() * 4) + 1, // 1-4 hours
        notes: `Maintenance schedule ${i} for ${pole.subcity} area`,
        completedDate: i <= 15 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
      });
    }

    console.log('✅ Created 30 maintenance schedules');
  }
  */

  console.log('✅ Database seed completed!');
  await app.close();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});



