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

export async function collegeHasRelatedData(manager: EntityManager, collegeId: string): Promise<boolean> {
  for (const tableName of COLLEGE_BUSINESS_TABLES) {
    const result = await manager.query(
      `SELECT EXISTS (SELECT 1 FROM "${tableName}" WHERE "collegeId" = $1 LIMIT 1) AS "exists"`,
      [collegeId],
    )

    const hasRows = result[0]?.exists
    if (hasRows === true || hasRows === 't') {
      return true
    }
  }

  return false
}
