import { IsString, IsDateString, IsOptional, IsArray, IsEnum, ValidateNested, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ReplacementReason, ComponentReused } from '../entities/pole-replacement.entity';

class NewPoleDataDto {
  @IsString()
  code: string;

  @IsString()
  subcity: string;

  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  gpsLat?: string;

  @IsOptional()
  @IsString()
  gpsLng?: string;

  @IsString()
  poleType: string;

  @IsString()
  heightMeters: string;

  @IsString()
  lampType: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  powerRatingWatt: number;

  @IsOptional()
  @IsString()
  poleInstallationDate?: string;

  @IsString()
  status: string;
}

class ReplacementDetailsDto {
  @IsDateString()
  replacementDate: string;

  @IsEnum(ReplacementReason)
  replacementReason: ReplacementReason;

  @IsString()
  replacedBy: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ComponentReused, { each: true })
  @Transform(({ value }) => {
    if (!Array.isArray(value)) return value;
    return value.map((component: string) => {
      // Transform lowercase frontend values to uppercase enum values
      switch (component) {
        case 'led_display': return ComponentReused.LED_DISPLAY;
        case 'camera': return ComponentReused.CAMERA;
        case 'phone_charger': return ComponentReused.PHONE_CHARGER;
        case 'lamp': return ComponentReused.LAMP;
        case 'wiring': return ComponentReused.WIRING;
        case 'mounting_hardware': return ComponentReused.MOUNTING_HARDWARE;
        default: return component;
      }
    });
  })
  reuseComponents?: ComponentReused[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePoleReplacementDto {
  @IsString()
  oldPoleCode: string;

  @ValidateNested()
  @Type(() => NewPoleDataDto)
  newPoleData: NewPoleDataDto;

  @ValidateNested()
  @Type(() => ReplacementDetailsDto)
  replacementDetails: ReplacementDetailsDto;
}
