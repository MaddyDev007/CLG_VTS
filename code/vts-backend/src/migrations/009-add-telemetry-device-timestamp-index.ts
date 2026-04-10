import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTelemetryDeviceTimestampIndex009 implements MigrationInterface {
  name = 'AddTelemetryDeviceTimestampIndex009'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON telemetry("deviceId", "timestamp")',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_telemetry_device_time')
  }
}
