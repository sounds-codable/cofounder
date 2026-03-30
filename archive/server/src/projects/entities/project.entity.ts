import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProjectStatus {
  OPEN = 'open', // 招募中
  MATCHED = 'matched', // 已匹配
  CLOSED = 'closed', // 已关闭
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  title: string; // 项目名称

  @Column()
  industry: string; // 所属行业

  @Column({ type: 'text' })
  description: string; // 项目介绍

  @Column({ type: 'text' })
  targetUsers: string; // 目标用户

  @Column({ type: 'text' })
  whySucceed: string; // 为什么这个项目能成

  @Column('simple-array')
  techNeeds: string[]; // 需要的技术能力（标签）

  @Column({ nullable: true, type: 'text' })
  techNotes: string; // 技术能力补充说明

  @Column({ type: 'text' })
  mvpPlan: string; // MVP计划

  @Column({ type: 'text', nullable: true })
  cooperationNotes: string; // 合作方式说明

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.OPEN,
  })
  status: ProjectStatus;

  @Column({ default: 0 })
  applicationCount: number; // 申请人数

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

