import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoleReplacement } from './entities/pole-replacement.entity';
import { CreatePoleReplacementDto } from './dto/create-pole-replacement.dto';
import { LightPole } from '../poles/entities/light-pole.entity';

@Injectable()
export class PoleReplacementsService {
  constructor(
    @InjectRepository(PoleReplacement)
    private poleReplacementRepository: Repository<PoleReplacement>,
    @InjectRepository(LightPole)
    private lightPoleRepository: Repository<LightPole>,
  ) {}

  async create(createPoleReplacementDto: CreatePoleReplacementDto): Promise<PoleReplacement> {
    const { oldPoleCode, newPoleData, replacementDetails } = createPoleReplacementDto;

    // Check if old pole exists
    const oldPole = await this.lightPoleRepository.findOne({
      where: { code: oldPoleCode }
    });

    if (!oldPole) {
      throw new NotFoundException(`Pole with code ${oldPoleCode} not found`);
    }

    // Check if new pole code already exists
    const existingNewPole = await this.lightPoleRepository.findOne({
      where: { code: newPoleData.code }
    });

    if (existingNewPole) {
      throw new BadRequestException(`Pole with code ${newPoleData.code} already exists`);
    }

    // Create new pole
    const newPole = this.lightPoleRepository.create({
      code: newPoleData.code,
      subcity: newPoleData.subcity as any,
      street: newPoleData.street,
      gpsLat: newPoleData.gpsLat ? parseFloat(newPoleData.gpsLat) : null,
      gpsLng: newPoleData.gpsLng ? parseFloat(newPoleData.gpsLng) : null,
      poleType: newPoleData.poleType as any,
      heightMeters: parseFloat(newPoleData.heightMeters),
      lampType: newPoleData.lampType as any,
      powerRatingWatt: newPoleData.powerRatingWatt,
      poleInstallationDate: newPoleData.poleInstallationDate ? new Date(newPoleData.poleInstallationDate) : null,
      status: newPoleData.status as any,
    });

    const savedNewPole = await this.lightPoleRepository.save(newPole);

    // Create pole replacement record
    const poleReplacement = this.poleReplacementRepository.create({
      oldPoleCode: oldPoleCode,
      newPoleCode: newPoleData.code,
      replacementDate: new Date(replacementDetails.replacementDate),
      replacementReason: replacementDetails.replacementReason as any,
      replacedBy: replacementDetails.replacedBy,
      reuseComponents: replacementDetails.reuseComponents,
      notes: replacementDetails.notes,
    });

    const savedReplacement = await this.poleReplacementRepository.save(poleReplacement);

    // Update old pole status to indicate it's been replaced
    await this.lightPoleRepository.update(
      { code: oldPoleCode },
      { status: 'REPLACED' as any } // Mark as replaced
    );

    return savedReplacement;
  }

  async findAll(): Promise<PoleReplacement[]> {
    return this.poleReplacementRepository.find({
      relations: ['oldPole', 'newPole'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PoleReplacement> {
    const replacement = await this.poleReplacementRepository.findOne({
      where: { id },
      relations: ['oldPole', 'newPole'],
    });

    if (!replacement) {
      throw new NotFoundException(`Pole replacement with ID ${id} not found`);
    }

    return replacement;
  }
}
