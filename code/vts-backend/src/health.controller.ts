import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { MqttService } from './mqtt/mqtt.service'
import { TelemetryStateService } from './mqtt/telemetry-state.service'
import { TemporalService } from './temporal/temporal.service'

@Controller()
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mqttService: MqttService,
    private readonly telemetryStateService: TelemetryStateService,
    private readonly temporalService: TemporalService,
  ) {}

  @Get('health')
  async getHealth() {
    let database = false

    try {
      await this.dataSource.query('SELECT 1')
      database = true
    } catch {
      database = false
    }

    const mqtt = this.mqttService.isConnected()
    const telemetryState = this.telemetryStateService.getStatus()
    const temporal = this.temporalService.getStatus()
    const ok = database && mqtt

    const payload = {
      ok,
      timestamp: new Date().toISOString(),
      services: {
        database,
        mqtt,
        telemetryState,
        temporal,
      },
    }

    if (!ok) {
      throw new ServiceUnavailableException(payload)
    }

    return payload
  }
}
