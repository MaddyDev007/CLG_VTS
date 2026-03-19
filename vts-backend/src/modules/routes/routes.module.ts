import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoutesController } from './routes.controller'
import { RoutesService } from './routes.service'
import { Route } from './route.entity'
import { RouteStop } from './route-stop.entity'
import { Vehicle } from '../vehicles/vehicle.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Route, RouteStop, Vehicle])],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}
