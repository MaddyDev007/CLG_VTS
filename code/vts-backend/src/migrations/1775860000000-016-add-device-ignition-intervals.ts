import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDeviceIgnitionIntervals1775860000000 implements MigrationInterface {
  name = 'AddDeviceIgnitionIntervals1775860000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS "ignitionOnIntervalMs" integer NOT NULL DEFAULT 5000
    `)

    await queryRunner.query(`
      ALTER TABLE devices
      ADD COLUMN IF NOT EXISTS "ignitionOffIntervalMs" integer NOT NULL DEFAULT 10000
    `)

    await queryRunner.query(`
      UPDATE devices
      SET
        "ignitionOnIntervalMs" = COALESCE("telemetryIntervalMs", 5000),
        "ignitionOffIntervalMs" = COALESCE("telemetryIntervalMs", 10000)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE devices
      DROP COLUMN IF EXISTS "ignitionOffIntervalMs"
    `)

    await queryRunner.query(`
      ALTER TABLE devices
      DROP COLUMN IF EXISTS "ignitionOnIntervalMs"
    `)
  }
}
