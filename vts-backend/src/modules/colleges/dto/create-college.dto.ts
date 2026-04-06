import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateCollegeDto {
  @ApiProperty({ example: 'North Campus College' })
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string

  @ApiPropertyOptional({
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'

  @ApiProperty({ example: 'Asha Rao' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  adminName!: string

  @ApiProperty({ example: 'asha.rao@example.com' })
  @IsEmail()
  adminEmail!: string
}
