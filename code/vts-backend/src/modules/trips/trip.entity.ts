import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Vehicle } from '../vehicles/vehicle.entity'

@Entity({ name: 'trips' })
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Column({ type: 'uuid' })
  vehicleId!: string

  @Column({ type: 'varchar', length: 120 })
  vehicleName!: string

  @Column({ type: 'varchar', length: 255 })
  startLocation!: string

  @Column({ type: 'varchar', length: 255 })
  endLocation!: string

  @Column({ type: 'timestamptz' })
  startTime!: Date

  @Column({ type: 'timestamptz', nullable: true })
  endTime!: Date | null

  @Column({ type: 'float', default: 0 })
  duration!: number

  @Column({ type: 'float', default: 0 })
  distance!: number

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle
}
