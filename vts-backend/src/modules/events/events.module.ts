import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventsController } from './events.controller'
import { EventsService } from './events.service'
import { OverspeedEvent } from './overspeed-event.entity'
import { IdlingEvent } from './idling-event.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { TelemetryRecord } from '../telemetry/telemetry.entity'
import { StopEventsController } from './stop-events.controller'
import { StopEventsService } from './stop-events.service'

@Module({
  imports: [TypeOrmModule.forFeature([OverspeedEvent, IdlingEvent, TelemetryRecord]), NotificationsModule],
  controllers: [EventsController, StopEventsController],
  providers: [EventsService, StopEventsService],
  exports: [EventsService, StopEventsService],
})
export class EventsModule {}
