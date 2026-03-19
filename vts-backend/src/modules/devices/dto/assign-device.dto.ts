import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class AssignDeviceDto {
  @ApiProperty({
    example: '4f6c2e1f-2e4a-4f7e-9c0d-9b7a5c0b1d2e',
    description: 'Vehicle identifier',
  })
  @IsString()
  vehicleId!: string

  @ApiProperty({ example: 'Campus Shuttle 3', description: 'Vehicle name' })
  @IsString()
  vehicleName!: string
}
