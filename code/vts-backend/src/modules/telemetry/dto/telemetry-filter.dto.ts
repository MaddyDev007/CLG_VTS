import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class TelemetryFilterDto {
  @ApiPropertyOptional({
    example: '4f6c2e1f-2e4a-4f7e-9c0d-9b7a5c0b1d2e',
    description: 'Filter by vehicle id',
  })
  @IsOptional()
  @IsString()
  vehicleId?: string

  @ApiPropertyOptional({ example: true, description: 'Filter by ignition state' })
  @IsOptional()
  @IsBoolean()
  ignition?: boolean

  @ApiPropertyOptional({ example: '2025-02-01T00:00:00Z', description: 'Filter start date (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string

  @ApiPropertyOptional({ example: '2025-02-01T23:59:59Z', description: 'Filter end date (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string
}
