import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTelemetryVehicleTimestampIndex008 implements MigrationInterface {
  name = 'AddTelemetryVehicleTimestampIndex008'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_timestamp ON telemetry("vehicleId", "timestamp" DESC)',
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_telemetry_vehicle_timestamp')
  }
}
