import 'reflect-metadata'
import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'

import { User } from '../modules/users/user.entity'
import { College } from '../modules/colleges/college.entity'
import { Vehicle } from '../modules/vehicles/vehicle.entity'
import { Device } from '../modules/devices/device.entity'
import { TelemetryRecord } from '../modules/telemetry/telemetry.entity'
import { Route } from '../modules/routes/route.entity'
import { RouteStop } from '../modules/routes/route-stop.entity'
import { Geofence } from '../modules/geofences/geofence.entity'
import { Trip } from '../modules/trips/trip.entity'
import { TripPlaybackPoint } from '../modules/trips/trip-playback.entity'
import { OverspeedEvent } from '../modules/events/overspeed-event.entity'
import { IdlingEvent } from '../modules/events/idling-event.entity'
import { Notification } from '../modules/notifications/notification.entity'
import { ProfilePreferences } from '../modules/profile/profile-preferences.entity'

dotenv.config({ path: '.env' })

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    College,
    Vehicle,
    Device,
    TelemetryRecord,
    Route,
    RouteStop,
    Geofence,
    Trip,
    TripPlaybackPoint,
    OverspeedEvent,
    IdlingEvent,
    Notification,
    ProfilePreferences,
  ],
  migrations: ['dist/migrations/1*.js'],
})
