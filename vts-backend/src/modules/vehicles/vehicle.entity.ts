import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { Device } from '../devices/device.entity'
import { TelemetryRecord } from '../telemetry/telemetry.entity'
import { Trip } from '../trips/trip.entity'
import { Route } from '../routes/route.entity'

export type VehicleStatus = 'moving' | 'idling' | 'stopped' | 'offline'
export type VehicleType = 'Bus' | 'Car' | 'Van' | 'Truck'

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 32 })
  registrationNumber!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Column({ type: 'varchar', length: 120 })
  vehicleName!: string

  @Column({ type: 'varchar', length: 16 })
  vehicleType!: VehicleType

  @Column({ type: 'varchar', length: 16 })
  status!: VehicleStatus

  @Column({ type: 'varchar', length: 64, nullable: true })
  deviceId!: string | null

  @Column({ type: 'float', default: 0 })
  speed!: number

  @Column({ type: 'double precision', default: 75 })
  speedLimit!: number

  @Column({ type: 'float', nullable: true })
  lat!: number | null

  @Column({ type: 'float', nullable: true })
  lon!: number | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  lastSeen!: Date | null

  @Column({ type: 'uuid', nullable: true })
  geofenceId!: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  geofenceName!: string | null

  @Column({ type: 'uuid', nullable: true })
  routeId!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date

  @OneToMany(() => Device, (device) => device.vehicle)
  devices!: Device[]

  @OneToMany(() => TelemetryRecord, (telemetry) => telemetry.vehicle)
  telemetryRecords!: TelemetryRecord[]

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips!: Trip[]

  @ManyToOne(() => Route, (route) => route.vehicles, { nullable: true })
  @JoinColumn({ name: 'routeId' })
  route?: Route | null
}
