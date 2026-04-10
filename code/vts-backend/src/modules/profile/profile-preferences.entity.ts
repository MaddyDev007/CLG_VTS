import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm'

@Entity({ name: 'profile_preferences' })
@Unique(['userId'])
export class ProfilePreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'varchar', length: 64 })
  timezone!: string

  @Column({ type: 'jsonb' })
  preferences!: {
    overspeed: boolean
    idling: boolean
    geofence: boolean
    stop: boolean
    deviceOffline: boolean
  }
}
