import { ConfigService } from '@nestjs/config'

export type MqttConfig = {
  url: string
  username?: string
  password?: string
  telemetryTopic: string
}

export function getMqttConfig(configService: ConfigService): MqttConfig {
  return {
    url: configService.get<string>('MQTT_URL') ?? configService.get<string>('MQTT_BROKER_URL', ''),
    username: configService.get<string>('MQTT_USERNAME') || undefined,
    password: configService.get<string>('MQTT_PASSWORD') || undefined,
    telemetryTopic: configService.get<string>('MQTT_TELEMETRY_TOPIC', 'vts/+/telemetry'),
  }
}
