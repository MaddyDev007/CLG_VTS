import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type UserRole = 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT'
export type UserStatus = 'active' | 'disabled'

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ type: 'varchar', length: 160, unique: true })
  email!: string

  @Column({ type: 'varchar', length: 32 })
  role!: UserRole

  @Column({ type: 'uuid', nullable: true })
  collegeId?: string | null

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: UserStatus

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
