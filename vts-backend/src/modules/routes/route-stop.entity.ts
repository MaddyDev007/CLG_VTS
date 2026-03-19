import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Route } from './route.entity'

export type RouteStopType = 'start' | 'intermediate' | 'end'

@Entity({ name: 'route_stops' })
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  routeId!: string

  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ type: 'float' })
  lat!: number

  @Column({ type: 'float' })
  lon!: number

  @Column({ type: 'int' })
  stopOrder!: number

  @Column({ type: 'varchar', length: 16 })
  stopType!: RouteStopType

  @ManyToOne(() => Route, (route) => route.routeStops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route!: Route
}
