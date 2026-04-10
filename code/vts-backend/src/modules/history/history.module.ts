import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HistoryController } from './history.controller'
import { HistoryService } from './history.service'
import { Vehicle } from '../vehicles/vehicle.entity'
import { TelemetryRecord } from '../telemetry/telemetry.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, TelemetryRecord])],
  controllers: [HistoryController],
  providers: [HistoryService],
})
export class HistoryModule {}
