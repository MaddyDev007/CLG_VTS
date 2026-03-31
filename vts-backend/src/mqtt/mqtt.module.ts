import { Module } from '@nestjs/common'
import { MqttService } from './mqtt.service'
import { TelemetryHandler } from './telemetry.handler'
import { TelemetryModule } from '../modules/telemetry/telemetry.module'
import { VehiclesModule } from '../modules/vehicles/vehicles.module'
import { DevicesModule } from '../modules/devices/devices.module'
import { TripsModule } from '../modules/trips/trips.module'
import { EventsModule } from '../modules/events/events.module'
import { WebsocketModule } from '../websocket/websocket.module'
import { TelemetryStateService } from './telemetry-state.service'

@Module({
  imports: [
    TelemetryModule,
    VehiclesModule,
    DevicesModule,
    TripsModule,
    EventsModule,
    WebsocketModule,
  ],
  providers: [MqttService, TelemetryHandler, TelemetryStateService],
})
export class MqttModule {}
