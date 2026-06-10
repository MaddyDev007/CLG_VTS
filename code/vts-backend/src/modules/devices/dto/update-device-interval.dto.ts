import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

export class UpdateDeviceIntervalDto {
  @ApiProperty({ example: 10000, description: 'Legacy telemetry interval in milliseconds' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  interval?: number

  @ApiProperty({ example: 5000, description: 'Telemetry interval in milliseconds when ignition is ON' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  ignitionOnInterval?: number

  @ApiProperty({ example: 10000, description: 'Telemetry interval in milliseconds when ignition is OFF' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(60000)
  ignitionOffInterval?: number
}
