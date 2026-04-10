import { ApiProperty } from '@nestjs/swagger'
import { IsInt, Max, Min } from 'class-validator'

export class UpdateDeviceIntervalDto {
  @ApiProperty({ example: 10000, description: 'Telemetry interval in milliseconds' })
  @IsInt()
  @Min(1000)
  @Max(60000)
  interval!: number
}
