import { DataSource } from 'typeorm';
import { Accident } from './entities/accident.entity';
import { AccidentStatus, AccidentType, ClaimStatus, DamageLevel } from './enums/accident.enums';
import { User } from '../users/entities/user.entity';
import { LightPole } from '../poles/entities/light-pole.entity';
import { AccidentsDamagedComponets } from './entities/accidents-damaged-componets.entity';
import { DamagedComponent } from './entities/damaged-component.entity';
import { AppModule } from '../app.module';
import { NestFactory } from '@nestjs/core';

async function seedAccidents(dataSource: DataSource): Promise<void> {
  console.log('🚨 Starting accident data seed...');

  const accidentRepository = dataSource.getRepository(Accident);
  const userRepository = dataSource.getRepository(User);
  const poleRepository = dataSource.getRepository(LightPole);
  const damagedComponentRepository = dataSource.getRepository(DamagedComponent);
  const accidentDamagedComponentsRepository = dataSource.getRepository(AccidentsDamagedComponets);

  // Check if accidents already exist
  const existingCount = await accidentRepository.count();
  if (existingCount > 0) {
    console.log(`🚨 Found ${existingCount} existing accidents. Clearing them for fresh seed...`);

    // Clear existing accident-related data
    await dataSource.query('DELETE FROM accidents_damaged_componets');
    await dataSource.query('DELETE FROM accident_approvals');
    await dataSource.query('DELETE FROM accident_photos');
    await dataSource.query('DELETE FROM accident_attachments');
    await dataSource.query('DELETE FROM accidents');

    console.log('✅ Cleared existing accident data');
  }

  // Get existing data
  const users = await userRepository.find();
  const poles = await poleRepository.find({ take: 100 }); // Get first 100 poles for variety
  const damagedComponents = await damagedComponentRepository.find();

  if (users.length === 0 || poles.length === 0 || damagedComponents.length === 0) {
    console.log('❌ Missing required data: users, poles, or damaged components');
    return;
  }

  // Helper functions
  const getRandomElement = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

  const getUserByRole = (role: string) => users.filter(u => u.role === role);
  const inspectors = getUserByRole('INSPECTOR');
  const supervisors = getUserByRole('SUPERVISOR');
  const financeUsers = getUserByRole('FINANCE');
  const admins = getUserByRole('ADMIN');

  // Accident data templates
  const accidentTemplates = [
    {
      type: AccidentType.VEHICLE_COLLISION,
      descriptions: [
        'Vehicle collided with light pole during heavy rain',
        'Car accident damaged street light pole',
        'Truck hit pole while making U-turn',
        'Motorcycle crash caused pole damage',
        'Bus accident knocked down street light'
      ],
      locations: [
        'Intersection of Africa Avenue and King George VI Street',
        'Bole Medhanealem area',
        'Piassa roundabout',
        'Mexico Square intersection',
        'Shiromeda road near CMC'
      ],
      vehicles: ['Toyota Corolla', 'Isuzu Truck', 'Honda Motorcycle', 'Anbessa Bus', 'Ford Ranger'],
      drivers: ['Abebe Kebede', 'Tigist Haile', 'Dawit Tesfaye', 'Mulugeta Worku', 'Helen Desta']
    },
    {
      type: AccidentType.FALLING_POLE,
      descriptions: [
        'Pole fell due to weakened foundation',
        'High winds caused pole to collapse',
        'Construction work damaged pole base',
        'Heavy vehicle impact caused pole to fall',
        'Foundation corrosion led to collapse'
      ],
      locations: [
        'Entoto Hill area',
        'Shiromeda residential zone',
        'Gotera commercial district',
        'Ayat industrial area',
        'Kotebe outskirts'
      ],
      vehicles: ['Construction Truck', 'Delivery Van', 'No vehicle involved', 'Service Vehicle', 'Emergency Response'],
      drivers: ['Construction Worker', 'Delivery Driver', 'Not applicable', 'Service Technician', 'Emergency Responder']
    },
    {
      type: AccidentType.VANDALISM,
      descriptions: [
        'Pole damaged by vandalism',
        'Cable theft caused damage',
        'Deliberate damage to light fixture',
        'Graffiti and physical damage',
        'Cable cutting incident'
      ],
      locations: [
        'Arada district streets',
        'Kirkos neighborhood',
        'Lideta commercial area',
        'Kolfe Keranio residential',
        'Nifas Silk-Lafto market area'
      ],
      vehicles: ['Not applicable', 'Unknown vehicle', 'No vehicle', 'Suspect vehicle', 'Not involved'],
      drivers: ['Unknown perpetrator', 'Not applicable', 'Suspect', 'No driver', 'Vandals']
    },
    {
      type: AccidentType.ELECTRICAL_FAULT,
      descriptions: [
        'Electrical short circuit damaged pole',
        'Power surge caused light fixture failure',
        'Wiring fault led to pole damage',
        'Overload caused electrical fire',
        'Lightning strike damaged equipment'
      ],
      locations: [
        'Yeka industrial zone',
        'Addis Ketema commercial district',
        'Gullele residential area',
        'Lemi Kura outskirts',
        'Akaky Kaliti area'
      ],
      vehicles: ['Not applicable', 'No vehicle', 'Service truck', 'Utility vehicle', 'Maintenance van'],
      drivers: ['Not applicable', 'Electrician', 'Maintenance technician', 'Utility worker', 'Service personnel']
    }
  ];

  // Insurance companies
  const insuranceCompanies = [
    'Lion Insurance', 'Awash International Bank Insurance', 'NIB Insurance', 'United Insurance', 'Africa Insurance'
  ];

  // Generate accidents with different workflow statuses
  const accidentsData = [];

  // Create accidents in different stages of the workflow
  const statusDistribution = {
    [AccidentStatus.REPORTED]: 8,      // Just reported
    [AccidentStatus.INSPECTED]: 6,     // Inspected but not approved
    [AccidentStatus.SUPERVISOR_REVIEW]: 4, // Supervisor reviewing
    [AccidentStatus.FINANCE_REVIEW]: 3,   // Finance reviewing
    [AccidentStatus.APPROVED]: 5,      // Approved for repairs
    [AccidentStatus.UNDER_REPAIR]: 3,  // Being repaired
    [AccidentStatus.COMPLETED]: 4,     // Repairs completed
    [AccidentStatus.REJECTED]: 2       // Rejected claims
  };

  let accidentCounter = 1;

  for (const [status, count] of Object.entries(statusDistribution)) {
    for (let i = 0; i < count; i++) {
      const template = getRandomElement(accidentTemplates);
      const pole = getRandomElement(poles);
      const inspector = getRandomElement(inspectors);
      const supervisor = getRandomElement(supervisors);
      const financeUser = getRandomElement(financeUsers);

      // Generate dates based on status progression
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 90)); // Within last 90 days

      const accidentDate = new Date(baseDate);
      accidentDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      let reportedDate = new Date(accidentDate);
      reportedDate.setHours(reportedDate.getHours() + Math.floor(Math.random() * 24)); // Report within 24 hours

      let inspectedDate: Date | undefined;
      let supervisorApprovedDate: Date | undefined;
      let financeApprovedDate: Date | undefined;
      let completedDate: Date | undefined;

      // Set dates based on status
      if (status !== AccidentStatus.REPORTED) {
        inspectedDate = new Date(reportedDate);
        inspectedDate.setDate(inspectedDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days after report
      }

      if ([AccidentStatus.SUPERVISOR_REVIEW, AccidentStatus.FINANCE_REVIEW, AccidentStatus.APPROVED, AccidentStatus.UNDER_REPAIR, AccidentStatus.COMPLETED].includes(status as AccidentStatus)) {
        supervisorApprovedDate = new Date(inspectedDate!);
        supervisorApprovedDate.setDate(supervisorApprovedDate.getDate() + Math.floor(Math.random() * 2) + 1); // 1-2 days after inspection
      }

      if ([AccidentStatus.FINANCE_REVIEW, AccidentStatus.APPROVED, AccidentStatus.UNDER_REPAIR, AccidentStatus.COMPLETED].includes(status as AccidentStatus)) {
        financeApprovedDate = new Date(supervisorApprovedDate!);
        financeApprovedDate.setDate(financeApprovedDate.getDate() + Math.floor(Math.random() * 3) + 1); // 1-3 days after supervisor approval
      }

      if ([AccidentStatus.UNDER_REPAIR, AccidentStatus.COMPLETED].includes(status as AccidentStatus)) {
        completedDate = new Date(financeApprovedDate!);
        completedDate.setDate(completedDate.getDate() + Math.floor(Math.random() * 14) + 3); // 3-16 days for repairs
      }

      // Generate claim status based on workflow
      let claimStatus = ClaimStatus.NOT_SUBMITTED;
      if ([AccidentStatus.APPROVED, AccidentStatus.UNDER_REPAIR, AccidentStatus.COMPLETED].includes(status as AccidentStatus)) {
        claimStatus = Math.random() < 0.8 ? ClaimStatus.SUBMITTED : ClaimStatus.APPROVED;
      }
      if (status === AccidentStatus.COMPLETED && claimStatus === ClaimStatus.APPROVED) {
        claimStatus = Math.random() < 0.7 ? ClaimStatus.PAID : ClaimStatus.APPROVED;
      }

      const accident = {
        incidentId: `ACC-${accidentDate.getFullYear()}${String(accidentDate.getMonth() + 1).padStart(2, '0')}-${String(accidentCounter).padStart(4, '0')}`,
        accidentType: template.type,
        accidentDate,
        accidentTime: accidentDate.toTimeString().substring(0, 5),
        poleId: pole.code,
        latitude: parseFloat((Number(pole.gpsLat) + (Math.random() - 0.5) * 0.001).toFixed(8)), // Slight variation from pole location
        longitude: parseFloat((Number(pole.gpsLng) + (Math.random() - 0.5) * 0.001).toFixed(8)),
        locationDescription: getRandomElement(template.locations),
        vehiclePlateNumber: template.type === AccidentType.VEHICLE_COLLISION ? `AA-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}` : undefined,
        driverName: template.type === AccidentType.VEHICLE_COLLISION ? getRandomElement(template.drivers) : undefined,
        insuranceCompany: template.type === AccidentType.VEHICLE_COLLISION ? getRandomElement(insuranceCompanies) : undefined,
        claimReferenceNumber: template.type === AccidentType.VEHICLE_COLLISION ? `CLM-${Math.floor(Math.random() * 999999)}` : undefined,
        claimStatus,
        damageLevel: getRandomElement([DamageLevel.MINOR, DamageLevel.MODERATE, DamageLevel.SEVERE, DamageLevel.TOTAL_LOSS]),
        damageDescription: getRandomElement(template.descriptions),
        safetyRisk: Math.random() < 0.3, // 30% have safety risks
        status: status as AccidentStatus,
        reportedById: inspector.id,
        inspectedById: inspectedDate ? inspector.id : undefined,
        supervisorApprovedById: supervisorApprovedDate ? supervisor.id : undefined,
        financeApprovedById: financeApprovedDate ? financeUser.id : undefined,
        createdAt: reportedDate,
        updatedAt: completedDate || financeApprovedDate || supervisorApprovedDate || inspectedDate || reportedDate,
      };

      accidentsData.push(accident);
      accidentCounter++;
    }
  }

  console.log(`🚨 Creating ${accidentsData.length} accident records...`);

  // Save accidents and create damaged components relationships
  for (const accidentData of accidentsData) {
    // Create the accident
    const accident = await accidentRepository.save(accidentData);

    // Add damaged components (1-4 random components per accident)
    const numComponents = Math.floor(Math.random() * 4) + 1;
    const selectedComponents = damagedComponents
      .sort(() => 0.5 - Math.random())
      .slice(0, numComponents);

    for (const component of selectedComponents) {
      await accidentDamagedComponentsRepository.save({
        accidentId: accident.id,
        damagedComponentId: component.id,
      });
    }

    // Calculate cost breakdown based on damaged components
    const costBreakdown = {};
    let totalCost = 0;

    for (const component of selectedComponents) {
      const cost = Number(component.totalLossCost);
      costBreakdown[component.name] = cost;
      totalCost += cost;
    }

    // Add labor and transport costs
    costBreakdown['Labour Cost'] = 300;
    costBreakdown['Transport Cost'] = 200;
    totalCost += 500;

    // Update accident with cost information
    await accidentRepository.update(accident.id, {
      estimatedCost: totalCost,
      costBreakdown,
    });

    console.log(`✅ Created accident ${accident.incidentId} - ${accident.status}`);
  }

  console.log('🚨 Accident seeding completed successfully!');
  console.log(`📊 Total accidents created: ${accidentsData.length}`);
  console.log('📋 Status distribution:');
  Object.entries(statusDistribution).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} accidents`);
  });
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    await seedAccidents(dataSource);
  } catch (error) {
    console.error('❌ Accident seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

export { seedAccidents };
