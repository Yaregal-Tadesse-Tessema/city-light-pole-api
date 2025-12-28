import { DataSource } from 'typeorm';
import { DamagedComponent, ComponentType } from './entities/damaged-component.entity';
import { COST_ESTIMATION_TABLES } from './enums/accident.enums';

export async function seedDamagedComponents(dataSource: DataSource): Promise<void> {
  const damagedComponentRepository = dataSource.getRepository(DamagedComponent);

  // Check if components already exist
  const existingCount = await damagedComponentRepository.count();
  if (existingCount > 0) {
    console.log('Damaged components already seeded');
    return;
  }

  const components = [
    {
      name: 'Light Pole',
      description: 'Main support pole for street lighting',
      componentType: ComponentType.POLE,
      minorCost: COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD.MINOR,
      moderateCost: COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD.MODERATE,
      severeCost: COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD.SEVERE,
      totalLossCost: COST_ESTIMATION_TABLES.POLE_TYPES.STANDARD.TOTAL_LOSS,
      sortOrder: 1,
    },
    {
      name: 'Luminaire',
      description: 'Light fixture and housing',
      componentType: ComponentType.LUMINAIRE,
      minorCost: COST_ESTIMATION_TABLES.COMPONENTS.LUMINAIRE.MINOR,
      moderateCost: COST_ESTIMATION_TABLES.COMPONENTS.LUMINAIRE.MODERATE,
      severeCost: COST_ESTIMATION_TABLES.COMPONENTS.LUMINAIRE.SEVERE,
      totalLossCost: COST_ESTIMATION_TABLES.COMPONENTS.LUMINAIRE.TOTAL_LOSS,
      sortOrder: 2,
    },
    {
      name: 'Arm & Bracket',
      description: 'Support arm and mounting bracket',
      componentType: ComponentType.ARM_BRACKET,
      minorCost: COST_ESTIMATION_TABLES.COMPONENTS.ARM_BRACKET.MINOR,
      moderateCost: COST_ESTIMATION_TABLES.COMPONENTS.ARM_BRACKET.MODERATE,
      severeCost: COST_ESTIMATION_TABLES.COMPONENTS.ARM_BRACKET.SEVERE,
      totalLossCost: COST_ESTIMATION_TABLES.COMPONENTS.ARM_BRACKET.TOTAL_LOSS,
      sortOrder: 3,
    },
    {
      name: 'Foundation',
      description: 'Base and foundation structure',
      componentType: ComponentType.FOUNDATION,
      minorCost: COST_ESTIMATION_TABLES.COMPONENTS.FOUNDATION.MINOR,
      moderateCost: COST_ESTIMATION_TABLES.COMPONENTS.FOUNDATION.MODERATE,
      severeCost: COST_ESTIMATION_TABLES.COMPONENTS.FOUNDATION.SEVERE,
      totalLossCost: COST_ESTIMATION_TABLES.COMPONENTS.FOUNDATION.TOTAL_LOSS,
      sortOrder: 4,
    },
    {
      name: 'Electrical Cable',
      description: 'Power and control cables',
      componentType: ComponentType.CABLE,
      minorCost: COST_ESTIMATION_TABLES.COMPONENTS.CABLE.MINOR,
      moderateCost: COST_ESTIMATION_TABLES.COMPONENTS.CABLE.MODERATE,
      severeCost: COST_ESTIMATION_TABLES.COMPONENTS.CABLE.SEVERE,
      totalLossCost: COST_ESTIMATION_TABLES.COMPONENTS.CABLE.TOTAL_LOSS,
      sortOrder: 5,
    },
  ];

  for (const componentData of components) {
    const component = damagedComponentRepository.create({
      ...componentData,
      isActive: true,
    });
    await damagedComponentRepository.save(component);
  }

  console.log('Damaged components seeded successfully');
}
