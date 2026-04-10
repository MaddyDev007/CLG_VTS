import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import type { NotificationType } from '../notification.entity'

export class CreateNotificationDto {
  @ApiProperty({
    example: 'overspeed',
    description: 'Notification type',
    enum: ['overspeed', 'geofence_enter', 'geofence_exit', 'idling', 'stop'],
  })
  @IsString()
  @IsIn(['overspeed', 'geofence_enter', 'geofence_exit', 'idling', 'stop'])
  type!: NotificationType

  @ApiProperty({ example: '4f6c2e1f-2e4a-4f7e-9c0d-9b7a5c0b1d2e', description: 'Vehicle identifier' })
  @IsString()
  vehicleId!: string

  @ApiPropertyOptional({ example: 'ae0cc126-df8a-4f57-89f7-a0d8115d2eb2', description: 'College identifier' })
  @IsOptional()
  @IsUUID()
  collegeId?: string

  @ApiProperty({ example: 'Bus 12', description: 'Vehicle display name' })
  @IsString()
  vehicleName!: string

  @ApiProperty({ example: 'Speed exceeded 60 km/h', description: 'Notification message' })
  @IsString()
  message!: string

  @ApiProperty({ example: 'MG Road, Bengaluru', description: 'Human-readable location' })
  @IsString()
  location!: string

  @ApiPropertyOptional({ example: 'geofence-001', description: 'Related geofence id' })
  @IsOptional()
  @IsString()
  geofenceId?: string

  @ApiPropertyOptional({ example: 'Campus Loop', description: 'Related route name' })
  @IsOptional()
  @IsString()
  routeName?: string

  @ApiPropertyOptional({ example: '2025-01-15T10:30:00Z', description: 'Event timestamp (ISO 8601)' })
  @IsOptional()
  @IsString()
  timestamp?: string
}
