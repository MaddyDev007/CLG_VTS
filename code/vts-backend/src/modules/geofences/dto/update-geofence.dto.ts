import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateGeofenceDto {
  @ApiPropertyOptional({ example: 'North Gate', description: 'Geofence name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ example: 'North Gate, Main Campus', description: 'Address or landmark' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ example: 12.9762, description: 'Latitude' })
  @IsOptional()
  @IsNumber()
  lat?: number

  @ApiPropertyOptional({ example: 77.6018, description: 'Longitude' })
  @IsOptional()
  @IsNumber()
  lon?: number

  @ApiPropertyOptional({ example: 150, description: 'Radius in meters' })
  @IsOptional()
  @IsNumber()
  radius?: number

  @ApiPropertyOptional({ example: true, description: 'Whether this geofence is a stop' })
  @IsOptional()
  @IsBoolean()
  isStop?: boolean
}
