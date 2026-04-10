import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRouteToNotifications002 implements MigrationInterface {
  name = 'AddRouteToNotifications002'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" ADD "routeName" character varying(120)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "routeName"`)
  }
}
