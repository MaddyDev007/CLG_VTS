import { MigrationInterface, QueryRunner } from 'typeorm'

export class EnforceTenantIsolation1773849625739 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        tenant_table text;
        tenant_tables text[] := ARRAY[
          'vehicles',
          'devices',
          'routes',
          'telemetry',
          'geofences',
          'trips',
          'notifications',
          'idling_events',
          'overspeed_events',
          'stop_events'
        ];
        null_count bigint;
        invalid_ref_count bigint;
        constraint_name text;
      BEGIN
        FOREACH tenant_table IN ARRAY tenant_tables
        LOOP
          EXECUTE format(
            'ALTER TABLE %I ADD COLUMN IF NOT EXISTS "collegeId" uuid',
            tenant_table
          );

          EXECUTE format(
            'SELECT count(*) FROM %I WHERE "collegeId" IS NULL',
            tenant_table
          )
          INTO null_count;

          IF null_count > 0 THEN
            RAISE EXCEPTION
              'Cannot enforce tenant isolation: table % contains % rows with NULL collegeId',
              tenant_table,
              null_count;
          END IF;

          EXECUTE format(
            'SELECT count(*) FROM %I t LEFT JOIN colleges c ON c.id = t."collegeId" WHERE t."collegeId" IS NOT NULL AND c.id IS NULL',
            tenant_table
          )
          INTO invalid_ref_count;

          IF invalid_ref_count > 0 THEN
            RAISE EXCEPTION
              'Cannot enforce tenant isolation: table % contains % rows with non-existent collegeId references',
              tenant_table,
              invalid_ref_count;
          END IF;

          FOR constraint_name IN
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel
              ON rel.oid = con.conrelid
            JOIN pg_namespace nsp
              ON nsp.oid = rel.relnamespace
            JOIN unnest(con.conkey) AS key_col(attnum)
              ON true
            JOIN pg_attribute att
              ON att.attrelid = rel.oid
             AND att.attnum = key_col.attnum
            WHERE con.contype = 'f'
              AND nsp.nspname = current_schema()
              AND rel.relname = tenant_table
              AND att.attname = 'collegeId'
          LOOP
            EXECUTE format(
              'ALTER TABLE %I DROP CONSTRAINT %I',
              tenant_table,
              constraint_name
            );
          END LOOP;

          EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN "collegeId" SET NOT NULL',
            tenant_table
          );

          EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("collegeId") REFERENCES colleges(id) ON DELETE CASCADE',
            tenant_table,
            'fk_' || tenant_table || '_college'
          );

          EXECUTE format(
            'CREATE INDEX IF NOT EXISTS %I ON %I ("collegeId")',
            'idx_' || tenant_table || '_collegeId',
            tenant_table
          );
        END LOOP;

        FOR constraint_name IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_class rel
            ON rel.oid = con.conrelid
          JOIN pg_namespace nsp
            ON nsp.oid = rel.relnamespace
          JOIN unnest(con.conkey) AS key_col(attnum)
            ON true
          JOIN pg_attribute att
            ON att.attrelid = rel.oid
           AND att.attnum = key_col.attnum
          WHERE con.contype = 'f'
            AND nsp.nspname = current_schema()
            AND rel.relname = 'users'
            AND att.attname = 'collegeId'
        LOOP
          EXECUTE format(
            'ALTER TABLE users DROP CONSTRAINT %I',
            constraint_name
          );
        END LOOP;

        UPDATE users u
        SET "collegeId" = NULL
        WHERE u.role = 'SUPER_ADMIN'
          AND u."collegeId" IS NOT NULL
          AND NOT EXISTS (
            SELECT 1
            FROM colleges c
            WHERE c.id = u."collegeId"
          );

        IF EXISTS (
          SELECT 1
          FROM users
          WHERE role <> 'SUPER_ADMIN'
            AND "collegeId" IS NULL
        ) THEN
          RAISE EXCEPTION
            'Cannot enforce user college rule: non-SUPER_ADMIN users with NULL collegeId exist';
        END IF;

        SELECT count(*)
        INTO invalid_ref_count
        FROM users u
        LEFT JOIN colleges c
          ON c.id = u."collegeId"
        WHERE u."collegeId" IS NOT NULL
          AND c.id IS NULL;

        IF invalid_ref_count > 0 THEN
          RAISE EXCEPTION
            'Cannot enforce user college foreign key: % users reference non-existent colleges',
            invalid_ref_count;
        END IF;

        IF EXISTS (
          SELECT 1
          FROM pg_constraint con
          JOIN pg_class rel
            ON rel.oid = con.conrelid
          JOIN pg_namespace nsp
            ON nsp.oid = rel.relnamespace
          WHERE con.contype = 'c'
            AND nsp.nspname = current_schema()
            AND rel.relname = 'users'
            AND con.conname = 'check_college_required'
        ) THEN
          ALTER TABLE users DROP CONSTRAINT check_college_required;
        END IF;

        ALTER TABLE users
          ADD CONSTRAINT fk_users_college
          FOREIGN KEY ("collegeId")
          REFERENCES colleges(id)
          ON DELETE SET NULL;

        ALTER TABLE users
          ADD CONSTRAINT check_college_required
          CHECK (role = 'SUPER_ADMIN' OR "collegeId" IS NOT NULL);

        CREATE INDEX IF NOT EXISTS "idx_users_collegeId"
          ON users ("collegeId");
      END $$;
    `)
  }

  public async down(_: QueryRunner): Promise<void> {}
}
