import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryTransaction } from './inventory-transaction.entity';
import { MaterialRequestItem } from './material-request-item.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { Category } from './category.entity';

export enum UnitOfMeasure {
  PIECES = 'pieces',
  METERS = 'meters',
  LITERS = 'liters',
  KILOGRAMS = 'kilograms',
  BOXES = 'boxes',
  UNITS = 'units',
}

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryColumn()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ManyToOne(() => Category, { nullable: false, eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @Column({
    type: 'enum',
    enum: UnitOfMeasure,
    default: UnitOfMeasure.PIECES,
  })
  unitOfMeasure: UnitOfMeasure;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  minimumThreshold: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitCost: number | null;

  @Column({ nullable: true })
  supplierName: string | null;

  @Column({ nullable: true })
  supplierContact: string | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.item)
  transactions: InventoryTransaction[];

  @OneToMany(() => MaterialRequestItem, (item) => item.inventoryItem)
  materialRequestItems: MaterialRequestItem[];

  @OneToMany(() => PurchaseRequestItem, (item) => item.inventoryItem)
  purchaseRequestItems: PurchaseRequestItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


