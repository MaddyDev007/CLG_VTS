import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateCollegeDto {
  @ApiPropertyOptional({ example: 'North Campus College' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'

  @ApiPropertyOptional({ example: 'Asha Rao' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  adminName?: string

  @ApiPropertyOptional({ example: 'asha.rao@example.com' })
  @IsOptional()
  @IsEmail()
  adminEmail?: string
}
