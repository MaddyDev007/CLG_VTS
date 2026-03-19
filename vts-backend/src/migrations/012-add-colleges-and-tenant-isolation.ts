import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCollegesAndTenantIsolation012 implements MigrationInterface {
  name = 'AddCollegesAndTenantIsolation012'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(160) NOT NULL UNIQUE,
        status varchar(16) NOT NULL DEFAULT 'active',
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      INSERT INTO colleges (id, name, status, "createdAt")
      SELECT DISTINCT
        uuid_generate_v5('6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid, u."collegeId"),
        u."collegeId",
        'active',
        now()
      FROM users u
      WHERE u."collegeId" IS NOT NULL
        AND TRIM(u."collegeId") <> ''
      ON CONFLICT (name) DO NOTHING
    `)

    await queryRunner.query(`
      UPDATE users
      SET "collegeId" = c.id
      FROM colleges c
      WHERE users."collegeId" = c.name
    `)

    await queryRunner.query(`
      ALTER TABLE users
      ALTER COLUMN "collegeId" TYPE uuid
      USING NULLIF(TRIM("collegeId"), '')::uuid
    `)

    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_college
      FOREIGN KEY ("collegeId") REFERENCES colleges(id) ON DELETE SET NULL
    `)

    const tenantTables = [
      'vehicles',
      'devices',
      'routes',
      'telemetry',
      'geofences',
      'trips',
      'notifications',
      'idling_events',
      'overspeed_events',
      'stop_events',
    ]

    for (const table of tenantTables) {
      await queryRunner.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS "collegeId" uuid`)
    }

    await queryRunner.query(`
      UPDATE vehicles v
      SET "collegeId" = d."collegeId"
      FROM devices d
      WHERE v."deviceId" = d."deviceId"
        AND v."collegeId" IS NULL
        AND d."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE devices d
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE d."assignedVehicleId" = v.id
        AND d."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE routes r
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE v."routeId" = r.id
        AND r."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE telemetry t
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE t."vehicleId" = v.id
        AND t."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE trips t
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE t."vehicleId" = v.id
        AND t."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE notifications n
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE n."vehicleId" = v.id
        AND n."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE idling_events e
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE e."vehicleId" = v.id
        AND e."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE overspeed_events e
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE e."vehicleId" = v.id
        AND e."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    await queryRunner.query(`
      UPDATE stop_events e
      SET "collegeId" = v."collegeId"
      FROM vehicles v
      WHERE e."vehicleId" = v.id
        AND e."collegeId" IS NULL
        AND v."collegeId" IS NOT NULL
    `)

    for (const table of tenantTables) {
      await queryRunner.query(`
        ALTER TABLE ${table}
        ADD CONSTRAINT fk_${table}_college
        FOREIGN KEY ("collegeId") REFERENCES colleges(id) ON DELETE RESTRICT
      `)
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_${table}_college_id ON ${table}("collegeId")`)
    }

    await queryRunner.query('CREATE INDEX IF NOT EXISTS idx_users_college_id ON users("collegeId")')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tenantTables = [
      'stop_events',
      'overspeed_events',
      'idling_events',
      'notifications',
      'trips',
      'geofences',
      'telemetry',
      'routes',
      'devices',
      'vehicles',
    ]

    await queryRunner.query('DROP INDEX IF EXISTS idx_users_college_id')

    for (const table of tenantTables) {
      await queryRunner.query(`DROP INDEX IF EXISTS idx_${table}_college_id`)
      await queryRunner.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS fk_${table}_college`)
      await queryRunner.query(`ALTER TABLE ${table} DROP COLUMN IF EXISTS "collegeId"`)
    }

    await queryRunner.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_college')
    await queryRunner.query('ALTER TABLE users ALTER COLUMN "collegeId" TYPE varchar(64)')
    await queryRunner.query('DROP TABLE IF EXISTS colleges')
  }
}
