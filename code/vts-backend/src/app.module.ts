import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { validateEnv } from './config/env.validation'
import { getDatabaseConfig } from './config/database.config'
import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { VehiclesModule } from './modules/vehicles/vehicles.module'
import { DevicesModule } from './modules/devices/devices.module'
import { TelemetryModule } from './modules/telemetry/telemetry.module'
import { RoutesModule } from './modules/routes/routes.module'
import { GeofencesModule } from './modules/geofences/geofences.module'
import { TripsModule } from './modules/trips/trips.module'
import { EventsModule } from './modules/events/events.module'
import { HistoryModule } from './modules/history/history.module'
import { NotificationsModule } from './modules/notifications/notifications.module'
import { ProfileModule } from './modules/profile/profile.module'
import { MqttModule } from './mqtt/mqtt.module'
import { WebsocketModule } from './websocket/websocket.module'
import { TemporalModule } from './temporal/temporal.module'
import { CollegeScopeMiddleware } from './common/tenant/college-scope.middleware'
import { CollegesModule } from './modules/colleges/colleges.module'
import { RolesGuard } from './common/guards/roles.guard'
import { IngestionModule } from './ingestion/ingestion.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    AuthModule,
    CollegesModule,
    UsersModule,
    VehiclesModule,
    DevicesModule,
    TelemetryModule,
    RoutesModule,
    GeofencesModule,
    TripsModule,
    EventsModule,
    HistoryModule,
    NotificationsModule,
    ProfileModule,
    MqttModule,
    IngestionModule,
    WebsocketModule,
    TemporalModule,
  ],
  controllers: [HealthController],
  providers: [RolesGuard],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CollegeScopeMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
