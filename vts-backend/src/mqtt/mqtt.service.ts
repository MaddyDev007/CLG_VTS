import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import mqtt, { MqttClient } from 'mqtt'
import { getMqttConfig } from '../config/mqtt.config'
import { TelemetryHandler } from './telemetry.handler'

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name)
  private client: MqttClient | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly telemetryHandler: TelemetryHandler
  ) {}

  onModuleInit() {
    const config = getMqttConfig(this.configService)

    this.logger.log(`Connecting to MQTT broker: ${config.url}`)

    this.client = mqtt.connect(config.url, {
      username: config.username,
      password: config.password,
      reconnectPeriod: 2000,
      connectTimeout: 5000,
      clean: true,
      keepalive: 30,
    })

    this.client.on('connect', () => {
      this.logger.log('MQTT connected')

      this.client?.subscribe(config.telemetryTopic, (err) => {
        if (err) {
          this.logger.error(`Subscription failed: ${err.message}`)
        } else {
          this.logger.log(`Subscribed to topic: ${config.telemetryTopic}`)
        }
      })
    })

    this.client.on('message', (topic, payload) => {
      const message = payload.toString()

      this.logger.debug(`MQTT message received`)
      this.logger.debug(`Topic: ${topic}`)
      this.logger.debug(`Payload: ${message}`)

      try {
        this.telemetryHandler.handle(topic, message)
      } catch (err) {
        this.logger.error(`Telemetry processing failed`, err)
      }
    })

    this.client.on('error', (err) => {
      this.logger.error(`MQTT error: ${err.message}`)
    })

    this.client.on('reconnect', () => {
      this.logger.warn('MQTT reconnecting...')
    })

    this.client.on('close', () => {
      this.logger.warn('MQTT connection closed')
    })
  }

  onModuleDestroy() {
    this.logger.log('Closing MQTT connection')
    this.client?.end()
  }
}