import { plainToInstance } from 'class-transformer'
import { IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator'

class EnvironmentVariables {
  @IsString()
  NODE_ENV!: string

  @IsInt()
  @Min(1)
  PORT!: number

  @IsString()
  DB_HOST!: string

  @IsInt()
  DB_PORT!: number

  @IsString()
  DB_NAME!: string

  @IsString()
  DB_USER!: string

  @IsString()
  DB_PASSWORD!: string

  @IsString()
  JWT_SECRET!: string

  @IsString()
  JWT_EXPIRES_IN!: string

  @IsString()
  MQTT_BROKER_URL!: string

  @IsOptional()
  @IsString()
  MQTT_USERNAME?: string

  @IsOptional()
  @IsString()
  MQTT_PASSWORD?: string

  @IsString()
  MQTT_TELEMETRY_TOPIC!: string

  @IsOptional()
  @IsString()
  WS_NAMESPACE?: string

  @IsOptional()
  @IsString()
  TEMPORAL_ADDRESS?: string
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })

  const errors = validateSync(validated, { skipMissingProperties: false })

  if (errors.length > 0) {
    throw new Error(`Env validation failed: ${errors}`)
  }

  return validated
}
