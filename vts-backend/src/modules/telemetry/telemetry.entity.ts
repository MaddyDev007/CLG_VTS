import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Vehicle } from '../vehicles/vehicle.entity'
import { Device } from '../devices/device.entity'

@Entity({ name: 'telemetry' })
export class TelemetryRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index('idx_telemetry_vehicle_id')
  @Column({ type: 'uuid' })
  vehicleId!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Column({ type: 'varchar', length: 120 })
  vehicleName!: string

  @Index('idx_telemetry_device_id')
  @Column({ type: 'varchar', length: 64 })
  deviceId!: string

  @Index('idx_telemetry_timestamp')
  @Column({ type: 'timestamptz' })
  timestamp!: Date

  @Column({ type: 'float' })
  lat!: number

  @Column({ type: 'float' })
  lon!: number

  @Column({ type: 'varchar', length: 255 })
  address!: string

  @Column({ type: 'float' })
  speed!: number

  @Column({ type: 'boolean' })
  ignition!: boolean

  @Column({ type: 'float' })
  battery!: number

  @Column({ type: 'float' })
  signal!: number

  @Column({ type: 'uuid', nullable: true })
  geofenceId!: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  geofenceName!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.telemetryRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'deviceId', referencedColumnName: 'deviceId' })
  device?: Device | null
}
