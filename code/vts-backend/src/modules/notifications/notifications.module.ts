import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotificationsController } from './notifications.controller'
import { NotificationsService } from './notifications.service'
import { Notification } from './notification.entity'
import { Route } from '../routes/route.entity'
import { Vehicle } from '../vehicles/vehicle.entity'
import { WebsocketModule } from '../../websocket/websocket.module'

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Route, Vehicle]), WebsocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
