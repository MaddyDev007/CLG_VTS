import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init001 implements MigrationInterface {
  name = 'Init001'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(120) NOT NULL,
        email varchar(160) NOT NULL UNIQUE,
        role varchar(32) NOT NULL,
        collegeId varchar(64),
        status varchar(16) NOT NULL DEFAULT 'active',
        passwordHash varchar(255) NOT NULL,
        createdAt timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        registrationNumber varchar(32) NOT NULL,
        vehicleName varchar(120) NOT NULL,
        vehicleType varchar(16) NOT NULL,
        status varchar(16) NOT NULL,
        deviceId varchar(64),
        speed float NOT NULL DEFAULT 0,
        lat float,
        lon float,
        address varchar(255),
        lastSeen timestamptz,
        createdAt timestamptz NOT NULL DEFAULT now(),
        updatedAt timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        deviceId varchar(64) NOT NULL UNIQUE,
        imei varchar(32) NOT NULL UNIQUE,
        assignedVehicleId uuid,
        assignedVehicleName varchar(120),
        status varchar(16) NOT NULL,
        createdAt timestamptz NOT NULL DEFAULT now(),
        updatedAt timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_devices_vehicle FOREIGN KEY (assignedVehicleId) REFERENCES vehicles(id) ON DELETE SET NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS telemetry (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicleId uuid NOT NULL,
        vehicleName varchar(120) NOT NULL,
        deviceId varchar(64) NOT NULL,
        timestamp timestamptz NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        address varchar(255) NOT NULL,
        speed float NOT NULL,
        ignition boolean NOT NULL,
        battery float NOT NULL,
        signal float NOT NULL,
        createdAt timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_telemetry_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry(timestamp)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_id ON telemetry(vehicleId)')
    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_telemetry_device_id ON telemetry(deviceId)')

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(120) NOT NULL,
        startStop jsonb NOT NULL,
        endStop jsonb NOT NULL,
        intermediateStops jsonb NOT NULL DEFAULT '[]',
        assignedVehicleId uuid,
        assignedVehicleName varchar(120),
        stopsCount int NOT NULL,
        status varchar(16) NOT NULL,
        createdAt timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT fk_routes_vehicle FOREIGN KEY (assignedVehicleId) REFERENCES vehicles(id) ON DELETE SET NULL
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS route_stops (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        routeId uuid NOT NULL,
        name varchar(120) NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        stopOrder int NOT NULL,
        stopType varchar(16) NOT NULL,
        CONSTRAINT fk_route_stops_route FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS geofences (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(120) NOT NULL,
        address varchar(255) NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        radius float NOT NULL,
        isStop boolean NOT NULL DEFAULT false,
        createdAt timestamptz NOT NULL DEFAULT now(),
        updatedAt timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicleId uuid NOT NULL,
        vehicleName varchar(120) NOT NULL,
        startLocation varchar(255) NOT NULL,
        endLocation varchar(255) NOT NULL,
        startTime timestamptz NOT NULL,
        endTime timestamptz,
        duration float NOT NULL DEFAULT 0,
        distance float NOT NULL DEFAULT 0,
        CONSTRAINT fk_trips_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS trip_playback_points (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        tripId uuid NOT NULL,
        timestamp timestamptz NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        speed float NOT NULL,
        CONSTRAINT fk_trip_playback_trip FOREIGN KEY (tripId) REFERENCES trips(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS overspeed_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicleId uuid NOT NULL,
        vehicleName varchar(120) NOT NULL,
        tripId varchar(64) NOT NULL,
        maxSpeed float NOT NULL,
        speedLimit float NOT NULL,
        duration float NOT NULL,
        startTime timestamptz NOT NULL,
        endTime timestamptz NOT NULL,
        location varchar(255) NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        CONSTRAINT fk_overspeed_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS idling_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicleId uuid NOT NULL,
        vehicleName varchar(120) NOT NULL,
        tripId varchar(64) NOT NULL,
        duration float NOT NULL,
        startTime timestamptz NOT NULL,
        endTime timestamptz NOT NULL,
        location varchar(255) NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        CONSTRAINT fk_idling_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stop_events (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        vehicleId uuid NOT NULL,
        vehicleName varchar(120) NOT NULL,
        tripId varchar(64) NOT NULL,
        duration float NOT NULL,
        startTime timestamptz NOT NULL,
        endTime timestamptz NOT NULL,
        location varchar(255) NOT NULL,
        lat float NOT NULL,
        lon float NOT NULL,
        CONSTRAINT fk_stop_vehicle FOREIGN KEY (vehicleId) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        type varchar(32) NOT NULL,
        vehicleId varchar(64) NOT NULL,
        vehicleName varchar(120) NOT NULL,
        message varchar(255) NOT NULL,
        location varchar(255) NOT NULL,
        timestamp timestamptz NOT NULL,
        read boolean NOT NULL DEFAULT false
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS profile_preferences (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        userId uuid NOT NULL UNIQUE,
        timezone varchar(64) NOT NULL,
        preferences jsonb NOT NULL,
        CONSTRAINT fk_profile_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS profile_preferences')
    await queryRunner.query('DROP TABLE IF EXISTS notifications')
    await queryRunner.query('DROP TABLE IF EXISTS stop_events')
    await queryRunner.query('DROP TABLE IF EXISTS idling_events')
    await queryRunner.query('DROP TABLE IF EXISTS overspeed_events')
    await queryRunner.query('DROP TABLE IF EXISTS trip_playback_points')
    await queryRunner.query('DROP TABLE IF EXISTS trips')
    await queryRunner.query('DROP TABLE IF EXISTS geofences')
    await queryRunner.query('DROP TABLE IF EXISTS route_stops')
    await queryRunner.query('DROP TABLE IF EXISTS routes')
    await queryRunner.query('DROP INDEX IF EXISTS idx_telemetry_device_id')
    await queryRunner.query('DROP INDEX IF EXISTS idx_telemetry_vehicle_id')
    await queryRunner.query('DROP INDEX IF EXISTS idx_telemetry_timestamp')
    await queryRunner.query('DROP TABLE IF EXISTS telemetry')
    await queryRunner.query('DROP TABLE IF EXISTS devices')
    await queryRunner.query('DROP TABLE IF EXISTS vehicles')
    await queryRunner.query('DROP TABLE IF EXISTS users')
  }
}
