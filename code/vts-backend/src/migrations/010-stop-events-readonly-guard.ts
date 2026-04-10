import { MigrationInterface, QueryRunner } from 'typeorm'

export class StopEventsReadonlyGuard010 implements MigrationInterface {
  name = 'StopEventsReadonlyGuard010'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('REVOKE INSERT, UPDATE, DELETE ON stop_events FROM PUBLIC')
    await queryRunner.query(
      `
        CREATE OR REPLACE FUNCTION prevent_stop_events_write()
        RETURNS trigger AS $$
        BEGIN
          RAISE EXCEPTION 'stop_events is read-only (derived data)';
        END;
        $$ LANGUAGE plpgsql;
      `,
    )
    await queryRunner.query(
      `
        CREATE TRIGGER stop_events_readonly
        BEFORE INSERT OR UPDATE OR DELETE ON stop_events
        FOR EACH ROW EXECUTE FUNCTION prevent_stop_events_write();
      `,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS stop_events_readonly ON stop_events')
    await queryRunner.query('DROP FUNCTION IF EXISTS prevent_stop_events_write')
    await queryRunner.query('GRANT INSERT, UPDATE, DELETE ON stop_events TO PUBLIC')
  }
}
