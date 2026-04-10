import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DevicesController } from './devices.controller'
import { DevicesService } from './devices.service'
import { Device } from './device.entity'
import { Vehicle } from '../vehicles/vehicle.entity'
import { MqttModule } from '../../mqtt/mqtt.module'

@Module({
  imports: [TypeOrmModule.forFeature([Device, Vehicle]), forwardRef(() => MqttModule)],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
