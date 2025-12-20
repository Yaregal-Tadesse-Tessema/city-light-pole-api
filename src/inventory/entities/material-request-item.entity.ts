import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MaterialRequest } from './material-request.entity';
import { InventoryItem } from './inventory-item.entity';

export enum RequestItemType {
  USAGE = 'USAGE', // Item is available, request to use
  PURCHASE = 'PURCHASE', // Item not available, request to purchase
}

export enum RequestItemStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FULFILLED = 'FULFILLED',
}

@Entity('material_request_items')
export class MaterialRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MaterialRequest, (request) => request.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'materialRequestId' })
  materialRequest: MaterialRequest;

  @Column()
  materialRequestId: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'inventoryItemCode' })
  inventoryItem: InventoryItem;

  @Column()
  inventoryItemCode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  requestedQuantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  availableQuantity: number; // Stock available at time of request

  @Column({
    type: 'enum',
    enum: RequestItemType,
  })
  requestType: RequestItemType; // USAGE or PURCHASE

  @Column({
    type: 'enum',
    enum: RequestItemStatus,
    default: RequestItemStatus.PENDING,
  })
  status: RequestItemStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualQuantityUsed: number | null; // Actual quantity used after approval
}


