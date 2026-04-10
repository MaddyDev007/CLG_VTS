import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type CollegeStatus = 'active' | 'inactive' | 'delete_pending'

@Entity({ name: 'colleges' })
export class College {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 160, unique: true })
  name!: string

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: CollegeStatus

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
