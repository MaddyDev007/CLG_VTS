import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsDateString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator'

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? value : parsed
}

export class StopEventsFilterDto {
  @ApiPropertyOptional({
    example: '4f6c2e1f-2e4a-4f7e-9c0d-9b7a5c0b1d2e',
    description: 'Filter by vehicle id',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00Z', description: 'Filter start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiPropertyOptional({ example: '2025-01-31T23:59:59Z', description: 'Filter end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string

  @ApiPropertyOptional({ example: 300000, description: 'Minimum stop duration in milliseconds' })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  minDuration?: number

  @ApiPropertyOptional({ example: 1800000, description: 'Maximum stop duration in milliseconds' })
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber()
  @Min(0)
  maxDuration?: number
}
