import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import type { TelemetryRecord } from '../telemetry/telemetry.entity'
import type { StopEventsFilterDto } from './dto/stop-events-filter.dto'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { isSuperAdmin, requireCollegeScope } from '../../common/tenant/tenant-scope'

export type StopEventRow = {
  id: string
  deviceId: string
  vehicleId: string
  vehicleName: string
  startTime: string
  endTime: string
  durationMs: number
  lat: number
  lon: number
  address: string | null
}

/**
 * Stop events are derived from telemetry. They must never be persisted.
 */
@Injectable()
export class StopEventsService {
  private readonly ignitionDebounceMs = 15 * 1000
  private readonly activeStopCapSeconds = 6 * 60 * 60

  constructor(private readonly dataSource: DataSource) {}

  async list(actor: AuthenticatedUser, filters: StopEventsFilterDto = {}): Promise<StopEventRow[]> {
    this.validateDateRange(filters)
    const { sql, params } = this.buildStopEventsQuery(actor, filters)
    const rows = await this.dataSource.query(sql, params)
    return rows.map((row: Record<string, unknown>) => this.mapRow(row))
  }

  async getById(actor: AuthenticatedUser, id: string): Promise<StopEventRow> {
    const { sql, params } = this.buildStopEventsQuery(actor, {}, { id })
    const [row] = await this.dataSource.query(sql, params)
    if (!row) {
      throw new NotFoundException('Stop event not found')
    }

    return this.mapRow(row)
  }

  async getPlayback(actor: AuthenticatedUser, id: string): Promise<TelemetryRecord[]> {
    const event = await this.getById(actor, id)

    const params: Array<string> = [event.deviceId, event.startTime, event.endTime]
    let collegeClause = ''
    if (!isSuperAdmin(actor)) {
      params.push(requireCollegeScope(actor))
      collegeClause = ` AND t."collegeId" = $4`
    }

    const rows = await this.dataSource.query(
      `
        SELECT
          t.id,
          t."vehicleId",
          t."vehicleName",
          t."deviceId",
          t.timestamp,
          t.lat,
          t.lon,
          t.address,
          t.speed,
          t.ignition,
          t.battery,
          t.signal,
          t."geofenceId",
          t."geofenceName",
          t."createdAt"
        FROM telemetry t
        WHERE t."deviceId" = $1
          AND t.timestamp BETWEEN $2::timestamptz AND $3::timestamptz
          ${collegeClause}
        ORDER BY t.timestamp ASC
      `,
      params,
    )

    return rows as TelemetryRecord[]
  }

  private buildStopEventsQuery(actor: AuthenticatedUser, filters: StopEventsFilterDto, options?: { id?: string }) {
    const params: Array<string | number> = []
    const whereClauses: string[] = []

    if (!isSuperAdmin(actor)) {
      params.push(requireCollegeScope(actor))
      whereClauses.push(`t."collegeId" = $${params.length}`)
    }

    if (filters.vehicleId) {
      params.push(filters.vehicleId)
      whereClauses.push(`t."vehicleId" = $${params.length}`)
    }

    const outerClauses: string[] = []

    if (filters.fromDate) {
      params.push(filters.fromDate)
      outerClauses.push(`stops."startTime" >= $${params.length}::timestamptz`)
    }

    if (filters.toDate) {
      params.push(filters.toDate)
      outerClauses.push(`stops."startTime" <= $${params.length}::timestamptz`)
    }

    if (typeof filters.minDuration === 'number') {
      params.push(filters.minDuration)
      outerClauses.push(`stops."durationMs" >= $${params.length}`)
    }

    if (typeof filters.maxDuration === 'number') {
      params.push(filters.maxDuration)
      outerClauses.push(`stops."durationMs" <= $${params.length}`)
    }

    if (options?.id) {
      params.push(options.id)
      outerClauses.push(`stops.id = $${params.length}`)
    }

    const sql = `
      WITH deduped AS (
        SELECT DISTINCT ON (t."deviceId", t.timestamp)
          t."deviceId",
          t."vehicleId",
          t."vehicleName",
          t.timestamp,
          t.lat,
          t.lon,
          t.address,
          t.ignition
        FROM telemetry t
        ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
        ORDER BY t."deviceId", t.timestamp, t."createdAt" DESC, t.id DESC
      ),
      ordered AS (
        SELECT
          d.*,
          LAG(d.ignition) OVER (PARTITION BY d."deviceId" ORDER BY d.timestamp) AS prev_ignition
        FROM deduped d
      ),
      stop_starts AS (
        SELECT
          o."deviceId",
          o."vehicleId",
          o."vehicleName",
          o.timestamp AS "startTime",
          o.lat,
          o.lon,
          o.address
        FROM ordered o
        WHERE o.ignition = false
          AND (o.prev_ignition = true OR o.prev_ignition IS NULL)
      ),
      stops AS (
        SELECT
          md5(ss."deviceId" || ':' || ss."startTime"::text) AS id,
          ss."deviceId",
          ss."vehicleId",
          ss."vehicleName",
          ss."startTime",
          COALESCE(next_on.timestamp, LEAST(NOW(), ss."startTime" + make_interval(secs => ${this.activeStopCapSeconds}))) AS "endTime",
          ROUND(
            EXTRACT(
              EPOCH FROM (
                COALESCE(next_on.timestamp, LEAST(NOW(), ss."startTime" + make_interval(secs => ${this.activeStopCapSeconds})))
                - ss."startTime"
              )
            ) * 1000
          )::bigint AS "durationMs",
          ss.lat,
          ss.lon,
          NULLIF(TRIM(ss.address), '') AS address
        FROM stop_starts ss
        LEFT JOIN LATERAL (
          SELECT o.timestamp
          FROM ordered o
          WHERE o."deviceId" = ss."deviceId"
            AND o.ignition = true
            AND o.timestamp > ss."startTime"
          ORDER BY o.timestamp ASC
          LIMIT 1
        ) next_on ON true
      )
      SELECT
        stops.id,
        stops."deviceId",
        stops."vehicleId",
        stops."vehicleName",
        stops."startTime",
        stops."endTime",
        stops."durationMs",
        stops.lat,
        stops.lon,
        stops.address
      FROM stops
      WHERE stops."durationMs" >= ${this.ignitionDebounceMs}
      ${outerClauses.length ? `AND ${outerClauses.join(' AND ')}` : ''}
      ORDER BY stops."startTime" DESC
    `

    return { sql, params }
  }

  private mapRow(row: Record<string, unknown>): StopEventRow {
    return {
      id: String(row.id),
      deviceId: String(row.deviceId),
      vehicleId: String(row.vehicleId),
      vehicleName: String(row.vehicleName),
      startTime: row.startTime instanceof Date ? row.startTime.toISOString() : String(row.startTime),
      endTime: row.endTime instanceof Date ? row.endTime.toISOString() : String(row.endTime),
      durationMs: Number(row.durationMs),
      lat: Number(row.lat),
      lon: Number(row.lon),
      address: row.address ? String(row.address) : null,
    }
  }

  private validateDateRange(filters: StopEventsFilterDto) {
    if (!filters.fromDate || !filters.toDate) {
      throw new BadRequestException('fromDate and toDate are required for stop-events queries')
    }

    const from = new Date(filters.fromDate)
    const to = new Date(filters.toDate)

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('fromDate and toDate must be valid ISO dates')
    }

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('fromDate must be earlier than or equal to toDate')
    }
  }
}
