import type { EntityManager } from 'typeorm'

export const COLLEGE_BUSINESS_TABLES = [
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
] as const

async function tableHasCollegeIdColumn(manager: EntityManager, tableName: string): Promise<boolean> {
  const result = await manager.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND column_name = 'collegeId'
      ) AS "exists"
    `,
    [tableName],
  )

  return result[0]?.exists === true || result[0]?.exists === 't'
}

export async function collegeHasRelatedData(manager: EntityManager, collegeId: string): Promise<boolean> {
  for (const tableName of COLLEGE_BUSINESS_TABLES) {
    const hasCollegeIdColumn = await tableHasCollegeIdColumn(manager, tableName)
    if (!hasCollegeIdColumn) {
      continue
    }

    try {
      const result = await manager.query(
        `SELECT EXISTS (SELECT 1 FROM "${tableName}" WHERE "collegeId" = $1 LIMIT 1) AS "exists"`,
        [collegeId],
      )

      const hasRows = result[0]?.exists
      if (hasRows === true || hasRows === 't') {
        return true
      }
    } catch (error) {
      const databaseError = error as { code?: string }
      if (databaseError.code !== '42P01' && databaseError.code !== '42703') {
        throw error
      }
    }
  }

  return false
}
