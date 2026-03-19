const { Pool } = require('pg')

const POSTGRES_URL =
  process.env.POSTGRES_URL || 'postgres://postgres:vts123@localhost:5432/vts'

async function loadAssignedDevices() {
  const pool = new Pool({
    connectionString: POSTGRES_URL,
  })

  try {
    const result = await pool.query(`
      SELECT
        "deviceId" AS device_id,
        imei
      FROM devices
      WHERE status = 'assigned'
    `)

    return result.rows
      .map((row) => ({
        device_id: row.device_id,
        imei: row.imei,
      }))
      .filter((row) => row.device_id)
  } catch (error) {
    console.error('[SIM] Failed to load devices:', error.message)
    throw error
  } finally {
    await pool.end().catch(() => undefined)
  }
}

module.exports = {
  POSTGRES_URL,
  loadAssignedDevices,
}