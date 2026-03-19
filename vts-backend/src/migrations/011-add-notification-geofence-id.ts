import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddNotificationGeofenceId011 implements MigrationInterface {
  name = 'AddNotificationGeofenceId011'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "geofenceId" uuid')
    await queryRunner.query(
      `
        ALTER TABLE "notifications"
        ADD CONSTRAINT IF NOT EXISTS fk_notification_geofence
        FOREIGN KEY ("geofenceId") REFERENCES geofences(id) ON DELETE SET NULL
      `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS fk_notification_geofence')
    await queryRunner.query('ALTER TABLE "notifications" DROP COLUMN IF EXISTS "geofenceId"')
  }
}
