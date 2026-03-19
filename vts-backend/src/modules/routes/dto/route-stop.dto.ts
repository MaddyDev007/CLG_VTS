import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsString } from 'class-validator'

export class RouteStopDto {
  @ApiProperty({ example: 'stop-001', description: 'Stop identifier' })
  @IsString()
  id!: string

  @ApiProperty({ example: 'Main Gate', description: 'Stop name' })
  @IsString()
  name!: string

  @ApiProperty({ example: 12.9716, description: 'Latitude' })
  @IsNumber()
  lat!: number

  @ApiProperty({ example: 77.5946, description: 'Longitude' })
  @IsNumber()
  lon!: number
}
