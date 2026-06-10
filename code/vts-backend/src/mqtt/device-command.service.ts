import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { MqttService } from './mqtt.service'

@Injectable()
export class DeviceCommandService {
  constructor(private readonly mqttService: MqttService) {}

  async sendIntervalUpdate(
    imei: string,
    intervals: { ignitionOnInterval: number; ignitionOffInterval: number },
  ) {
    const topic = `vts/devices/${imei}/commands`
    const payload = JSON.stringify({
      type: 'config_update',
      ignitionOnInterval: intervals.ignitionOnInterval,
      ignitionOffInterval: intervals.ignitionOffInterval,
    })

    try {
      await this.mqttService.publish(topic, payload)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown MQTT publish failure'
      throw new ServiceUnavailableException(`Failed to publish device command: ${reason}`)
    }
  }
}
