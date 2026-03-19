import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVehicleRouteId1710000000004 implements MigrationInterface {
  name = 'AddVehicleRouteId1710000000004'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "routeId" uuid;
    `)

    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD CONSTRAINT IF NOT EXISTS fk_vehicle_route
      FOREIGN KEY ("routeId") REFERENCES routes(id) ON DELETE SET NULL;
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP CONSTRAINT IF EXISTS fk_vehicle_route;
    `)

    await queryRunner.query(`
      ALTER TABLE vehicles
      DROP COLUMN IF EXISTS "routeId";
    `)
  }
}
