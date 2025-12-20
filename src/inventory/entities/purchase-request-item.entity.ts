import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PurchaseRequest } from './purchase-request.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('purchase_request_items')
export class PurchaseRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PurchaseRequest, (request) => request.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseRequestId' })
  purchaseRequest: PurchaseRequest;

  @Column()
  purchaseRequestId: string;

  @ManyToOne(() => InventoryItem)
  @JoinColumn({ name: 'inventoryItemCode' })
  inventoryItem: InventoryItem;

  @Column()
  inventoryItemCode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  requestedQuantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalCost: number;
}


