import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'

export class ListVehiclesDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page: number = 1

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(500)
  limit: number = 20

  @ApiPropertyOptional({ example: 'bus' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ example: 'moving', enum: ['moving', 'idling', 'stopped', 'offline'] })
  @IsOptional()
  @IsIn(['moving', 'idling', 'stopped', 'offline'])
  status?: 'moving' | 'idling' | 'stopped' | 'offline'

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  collegeId?: string
}
