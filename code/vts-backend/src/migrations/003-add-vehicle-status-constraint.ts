import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVehicleStatusConstraint003 implements MigrationInterface {
  name = 'AddVehicleStatusConstraint003'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "valid_vehicle_status" CHECK (status IN ('moving','idling','stopped','offline'))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "valid_vehicle_status"`)
  }
}
