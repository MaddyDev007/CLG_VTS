import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import mqtt, { MqttClient } from 'mqtt'
import { getMqttConfig } from '../config/mqtt.config'
import { TelemetryHandler } from './telemetry.handler'
import { DeviceAckService } from './device-ack.service'

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name)
  private client: MqttClient | null = null
  private readonly ackTopic = 'vts/devices/+/ack'

  constructor(
    private readonly configService: ConfigService,
    private readonly telemetryHandler: TelemetryHandler,
    private readonly deviceAckService: DeviceAckService,
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

      this.subscribe(config.telemetryTopic)
      this.subscribe(this.ackTopic)
    })

    this.client.on('message', (topic, payload) => {
      void this.handleIncomingMessage(topic, payload.toString())
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

  async publish(topic: string, payload: string): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT client is not connected')
    }

    await new Promise<void>((resolve, reject) => {
      this.client?.publish(topic, payload, { qos: 1 }, (error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  private subscribe(topic: string) {
    this.client?.subscribe(topic, (error) => {
      if (error) {
        this.logger.error(`Subscription failed for ${topic}: ${error.message}`)
        return
      }

      this.logger.log(`Subscribed to topic: ${topic}`)
    })
  }

  private async handleIncomingMessage(topic: string, message: string) {
    this.logger.debug(`MQTT message received`)
    this.logger.debug(`Topic: ${topic}`)
    this.logger.debug(`Payload: ${message}`)

    try {
      if (this.isAckTopic(topic)) {
        this.deviceAckService.handleAck(topic, message)
        return
      }

      await this.telemetryHandler.handle(topic, message)
    } catch (error) {
      const details = error instanceof Error ? error.stack ?? error.message : String(error)
      this.logger.error(`MQTT message processing failed for ${topic}`, details)
    }
  }

  private isAckTopic(topic: string): boolean {
    const parts = topic.split('/')
    return parts.length === 4 && parts[0] === 'vts' && parts[1] === 'devices' && parts[3] === 'ack'
  }
}
