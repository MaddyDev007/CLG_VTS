import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator'
import type { VehicleType } from '../vehicle.entity'

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Campus Shuttle 3', description: 'Vehicle name' })
  @IsOptional()
  @IsString()
  vehicleName?: string

  @ApiPropertyOptional({
    example: 'Bus',
    description: 'Vehicle type',
    enum: ['Bus', 'Car', 'Van', 'Truck'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['Bus', 'Car', 'Van', 'Truck'])
  vehicleType?: VehicleType

  @ApiPropertyOptional({ example: 'DEV_0003', description: 'Assigned device id' })
  @IsOptional()
  @IsString()
  deviceId?: string

  @ApiPropertyOptional({ example: 'route-001', description: 'Assigned route id (null to clear)' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  routeId?: string | null

  @ApiPropertyOptional({ example: 60, description: 'Speed limit in km/h' })
  @IsOptional()
  @IsNumber()
  speedLimit?: number
}
