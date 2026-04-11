import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ContactType } from '../common/enums/contact-type.enum';
import { User } from '../users/user.entity';

@Entity({ name: 'contact_methods' })
export class ContactMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.contactMethods, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'enum', enum: ContactType })
  type!: ContactType;

  @Column({ length: 160 })
  value!: string;

  @Column({ default: false })
  isPrimary!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
