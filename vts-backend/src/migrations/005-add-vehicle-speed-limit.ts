import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVehicleSpeedLimit1710000000005 implements MigrationInterface {
  name = 'AddVehicleSpeedLimit1710000000005'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "speedLimit" double precision DEFAULT 75;
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP COLUMN IF EXISTS "speedLimit";
    `)
  }
}
