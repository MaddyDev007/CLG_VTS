import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index
} from 'typeorm'
import { Vehicle } from '../vehicles/vehicle.entity'

export type DeviceStatus = 'assigned' | 'unassigned'

@Entity({ name: 'devices' })
export class Device {

  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'varchar', length: 64, unique: true })
  deviceId!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Index()
  @Column({ type: 'varchar', length: 15, unique: true })
  imei!: string

  @Column({ type: 'integer', default: 5000 })
  telemetryIntervalMs!: number

  @Column({ type: 'integer', default: 5000 })
  ignitionOnIntervalMs!: number

  @Column({ type: 'integer', default: 10000 })
  ignitionOffIntervalMs!: number

  @Column({ type: 'uuid', nullable: true })
  assignedVehicleId!: string | null

  // ⚠ optional denormalized field (avoid if possible)
  @Column({ type: 'varchar', length: 120, nullable: true })
  assignedVehicleName!: string | null

  @Column({
    type: 'varchar',
    length: 16,
    default: 'unassigned'
  })
  status!: DeviceStatus

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.devices, {
    nullable: true,
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'assignedVehicleId' })
  vehicle!: Vehicle | null
}
