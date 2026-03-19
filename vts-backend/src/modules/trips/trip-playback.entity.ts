import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Trip } from './trip.entity'

@Entity({ name: 'trip_playback_points' })
export class TripPlaybackPoint {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  tripId!: string

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip!: Trip

  @Column({ type: 'timestamptz' })
  timestamp!: Date

  @Column({ type: 'float' })
  lat!: number

  @Column({ type: 'float' })
  lon!: number

  @Column({ type: 'float' })
  speed!: number
}
