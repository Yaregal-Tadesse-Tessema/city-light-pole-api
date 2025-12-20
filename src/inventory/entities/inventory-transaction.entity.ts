import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { InventoryItem } from './inventory-item.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  IN = 'IN', // Stock added
  OUT = 'OUT', // Stock removed
  ADJUSTMENT = 'ADJUSTMENT', // Manual adjustment
  USAGE = 'USAGE', // Used in maintenance
  PURCHASE = 'PURCHASE', // Purchased and added
}

@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemCode' })
  item: InventoryItem;

  @Column()
  itemCode: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  stockBefore: number;

  @Column('decimal', { precision: 10, scale: 2 })
  stockAfter: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  reference: string | null; // Maintenance Schedule ID, Purchase Request ID, etc.

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;
}


