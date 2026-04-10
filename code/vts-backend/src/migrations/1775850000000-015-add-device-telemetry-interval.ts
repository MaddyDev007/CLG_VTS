import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDeviceTelemetryInterval1775850000000 implements MigrationInterface {
  name = 'AddDeviceTelemetryInterval1775850000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS "telemetryIntervalMs" integer NOT NULL DEFAULT 5000
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devices
      DROP COLUMN IF EXISTS "telemetryIntervalMs"
    `)
  }
}
