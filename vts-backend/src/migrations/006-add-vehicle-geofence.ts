import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVehicleGeofence1710000000006 implements MigrationInterface {
  name = 'AddVehicleGeofence1710000000006'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "geofenceId" uuid;
    `)

    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "geofenceName" varchar(120);
    `)

    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD CONSTRAINT IF NOT EXISTS fk_vehicle_geofence
      FOREIGN KEY ("geofenceId") REFERENCES geofences(id) ON DELETE SET NULL;
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP CONSTRAINT IF EXISTS fk_vehicle_geofence;
    `)

    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP COLUMN IF EXISTS "geofenceName";
    `)

    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP COLUMN IF EXISTS "geofenceId";
    `)
  }
}
