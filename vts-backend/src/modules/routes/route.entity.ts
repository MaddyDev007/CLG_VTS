import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Vehicle } from '../vehicles/vehicle.entity'
import { RouteStop as RouteStopEntity } from './route-stop.entity'

export type RouteStatus = 'active' | 'idle'

export type RouteStop = {
  id: string
  name: string
  lat: number
  lon: number
}

@Entity({ name: 'routes' })
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  collegeId!: string

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ type: 'jsonb' })
  startStop!: RouteStop

  @Column({ type: 'jsonb' })
  endStop!: RouteStop

  @Column({ type: 'jsonb', default: [] })
  intermediateStops!: RouteStop[]

  @Column({ type: 'int' })
  stopsCount!: number

  @Column({ type: 'varchar', length: 16 })
  status!: RouteStatus

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @OneToMany(() => RouteStopEntity, (stop) => stop.route, { cascade: true })
  routeStops!: RouteStopEntity[]

  @OneToMany(() => Vehicle, (vehicle) => vehicle.route)
  vehicles!: Vehicle[]
}
