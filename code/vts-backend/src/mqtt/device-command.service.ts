import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { MqttService } from './mqtt.service'

@Injectable()
export class DeviceCommandService {
  constructor(private readonly mqttService: MqttService) {}

  async sendIntervalUpdate(deviceId: string, interval: number) {
    const topic = `vts/devices/${deviceId}/commands`
    const payload = JSON.stringify({
      type: 'config_update',
      interval,
    })

    try {
      await this.mqttService.publish(topic, payload)
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown MQTT publish failure'
      throw new ServiceUnavailableException(`Failed to publish device command: ${reason}`)
    }
  }
}
