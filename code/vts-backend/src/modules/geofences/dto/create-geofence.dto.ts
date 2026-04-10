import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateGeofenceDto {
  @ApiProperty({ example: 'North Gate', description: 'Geofence name' })
  @IsString()
  name!: string

  @ApiProperty({ example: 'North Gate, Main Campus', description: 'Address or landmark' })
  @IsString()
  address!: string

  @ApiProperty({ example: 12.9762, description: 'Latitude' })
  @IsNumber()
  lat!: number

  @ApiProperty({ example: 77.6018, description: 'Longitude' })
  @IsNumber()
  lon!: number

  @ApiProperty({ example: 150, description: 'Radius in meters' })
  @IsNumber()
  radius!: number

  @ApiPropertyOptional({ example: true, description: 'Whether this geofence is a stop' })
  @IsOptional()
  @IsBoolean()
  isStop?: boolean
}
