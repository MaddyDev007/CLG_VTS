import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import type { NotificationType } from '../notification.entity'

export class ListNotificationsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page: number = 1

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20

  @ApiPropertyOptional({ example: 'overspeed' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ enum: ['overspeed', 'geofence_enter', 'geofence_exit', 'idling', 'stop'] })
  @IsOptional()
  @IsIn(['overspeed', 'geofence_enter', 'geofence_exit', 'idling', 'stop'])
  type?: NotificationType

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  fromDate?: string

  @ApiPropertyOptional({ example: '2026-03-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  toDate?: string
}
