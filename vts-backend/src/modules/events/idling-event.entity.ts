import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Vehicle } from '../vehicles/vehicle.entity'

@Entity({ name: 'idling_events' })
export class IdlingEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Column({ type: 'uuid' })
  vehicleId!: string

  @Column({ type: 'varchar', length: 120 })
  vehicleName!: string

  @Column({ type: 'uuid' })
  tripId!: string

  @Column({ type: 'float' })
  duration!: number

  @Column({ type: 'timestamptz' })
  startTime!: Date

  @Column({ type: 'timestamptz' })
  endTime!: Date

  @Column({ type: 'varchar', length: 255 })
  location!: string

  @Column({ type: 'float' })
  lat!: number

  @Column({ type: 'float' })
  lon!: number

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle!: Vehicle
}
