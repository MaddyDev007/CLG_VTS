import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateTelemetryDto {
  @ApiProperty({ example: 'DEV_0003', description: 'Device identifier' })
  @IsString()
  deviceId!: string

  @ApiProperty({ example: 12.9716, description: 'Latitude' })
  @IsNumber()
  lat!: number

  @ApiProperty({ example: 77.5946, description: 'Longitude' })
  @IsNumber()
  lon!: number

  @ApiProperty({ example: 42.5, description: 'Speed in km/h' })
  @IsNumber()
  speed!: number

  @ApiProperty({ example: true, description: 'Ignition status' })
  @IsBoolean()
  ignition!: boolean

  @ApiPropertyOptional({ example: '2025-02-01T10:15:00Z', description: 'Timestamp (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  timestamp?: string
}
