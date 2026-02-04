import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LightPole } from '../../poles/entities/light-pole.entity';
import { AccidentPhoto } from './accident-photo.entity';
import { AccidentAttachment } from './accident-attachment.entity';
import { AccidentApproval } from './accident-approval.entity';
import {
    DamageLevel,
    AccidentStatus,
    ClaimStatus,
} from '../enums/accident.enums';
import { DamagedComponent } from './damaged-component.entity';
import { Accident } from './accident.entity';
@Entity('accidents_damaged_componets')
export class AccidentsDamagedComponets {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    @Column()
    accidentId: string;
    @Column()
    damagedComponentId: string;
    @ManyToOne(() => DamagedComponent, (damagedComponent) => damagedComponent.id)
    @JoinColumn({ name: 'damagedComponentId' })
    damagedComponent: DamagedComponent;

    @ManyToOne(() => Accident, (accident) => accident.id)
    @JoinColumn({ name: 'accidentId' })
    accident: Accident;

}
