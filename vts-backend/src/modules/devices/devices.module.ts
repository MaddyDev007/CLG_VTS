import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { Device } from './device.entity'
import { Vehicle } from '../vehicles/vehicle.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Device, Vehicle])],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
