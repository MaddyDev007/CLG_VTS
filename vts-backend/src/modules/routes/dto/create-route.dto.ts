import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { RouteStopDto } from './route-stop.dto'

export class CreateRouteDto {
  @ApiProperty({ example: 'Campus Loop', description: 'Route name' })
  @IsString()
  name!: string

  @ApiProperty({
    type: RouteStopDto,
    example: { id: 'stop-001', name: 'Main Gate', lat: 12.9716, lon: 77.5946 },
    description: 'Starting stop',
  })
  @ValidateNested()
  @Type(() => RouteStopDto)
  startStop!: RouteStopDto

  @ApiProperty({
    type: RouteStopDto,
    example: { id: 'stop-010', name: 'Hostel Block', lat: 12.975, lon: 77.602 },
    description: 'Ending stop',
  })
  @ValidateNested()
  @Type(() => RouteStopDto)
  endStop!: RouteStopDto

  @ApiProperty({
    type: [RouteStopDto],
    example: [
      { id: 'stop-005', name: 'Library', lat: 12.9728, lon: 77.5995 },
      { id: 'stop-007', name: 'Admin Block', lat: 12.974, lon: 77.6002 },
    ],
    description: 'Intermediate stops',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  intermediateStops!: RouteStopDto[]
}
