import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VehiclesController } from './vehicles.controller'
import { VehiclesService } from './vehicles.service'
import { Vehicle } from './vehicle.entity'
import { TripsModule } from '../trips/trips.module'
import { TelemetryModule } from '../telemetry/telemetry.module'
import { TelemetryRecord } from '../telemetry/telemetry.entity'
import { DevicesModule } from '../devices/devices.module'
import { Route } from '../routes/route.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, TelemetryRecord, Route]),
    TripsModule,
    TelemetryModule,
    forwardRef(() => DevicesModule),
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
