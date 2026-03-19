import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTelemetryGeofence007 implements MigrationInterface {
  name = 'AddTelemetryGeofence007'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE telemetry
      ADD COLUMN IF NOT EXISTS "geofenceId" uuid
    `)

    await queryRunner.query(`
      ALTER TABLE telemetry
      ADD COLUMN IF NOT EXISTS "geofenceName" varchar(120)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE telemetry
      DROP COLUMN IF EXISTS "geofenceName"
    `)

    await queryRunner.query(`
      ALTER TABLE telemetry
      DROP COLUMN IF EXISTS "geofenceId"
    `)
  }
}
