import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, Matches } from 'class-validator'

export class UpdateDeviceDto {
  @ApiPropertyOptional({ example: 'DEV_0001', description: 'Unique device identifier' })
  @IsOptional()
  @IsString()
  deviceId?: string

  @ApiPropertyOptional({ example: '123456789012345', description: 'IMEI (15 digits)' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{15}$/)
  imei?: string
}
