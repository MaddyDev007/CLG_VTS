import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TelemetryController } from './telemetry.controller'
import { TelemetryService } from './telemetry.service'
import { TelemetryRecord } from './telemetry.entity'
import { Device } from '../devices/device.entity'
import { Vehicle } from '../vehicles/vehicle.entity'
import { GeocoderService } from '../../common/services/geocoder.service'
import { GeofencesModule } from '../geofences/geofences.module'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [TypeOrmModule.forFeature([TelemetryRecord, Device, Vehicle]), GeofencesModule, NotificationsModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, GeocoderService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
