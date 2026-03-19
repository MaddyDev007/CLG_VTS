import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import type { VehicleType } from '../vehicle.entity'

export class CreateVehicleDto {
  @ApiProperty({ example: 'Campus Shuttle 3', description: 'Vehicle name' })
  @IsString()
  vehicleName!: string

  @ApiProperty({
    example: 'Bus',
    description: 'Vehicle type',
    enum: ['Bus', 'Car', 'Van', 'Truck'],
  })
  @IsString()
  @IsIn(['Bus', 'Car', 'Van', 'Truck'])
  vehicleType!: VehicleType

  @ApiPropertyOptional({ example: 'DEV_0003', description: 'Assigned device id' })
  @IsOptional()
  @IsString()
  deviceId?: string
}
