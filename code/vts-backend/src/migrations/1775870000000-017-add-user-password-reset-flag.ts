import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserPasswordResetFlag1775870000000 implements MigrationInterface {
  name = 'AddUserPasswordResetFlag1775870000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN IF EXISTS "mustChangePassword"
    `)
  }
}
