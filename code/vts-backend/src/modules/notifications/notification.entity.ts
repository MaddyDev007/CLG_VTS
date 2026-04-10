import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

export type NotificationType = 'overspeed' | 'geofence_enter' | 'geofence_exit' | 'idling' | 'stop'

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Column({ type: 'varchar', length: 32 })
  type!: NotificationType

  @Column({ type: 'uuid' })
  vehicleId!: string

  @Column({ type: 'varchar', length: 120 })
  vehicleName!: string

  @Column({ type: 'varchar', length: 255 })
  message!: string

  @Column({ type: 'varchar', length: 255 })
  location!: string

  @Column({ type: 'uuid', nullable: true })
  geofenceId!: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  routeName!: string | null

  @Column({ type: 'timestamptz' })
  timestamp!: Date

  @Column({ type: 'boolean', default: false })
  read!: boolean
}
