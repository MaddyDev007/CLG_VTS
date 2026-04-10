import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator'
import type { UserRole, UserStatus } from '../user.entity'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Asha Rao', description: 'Full name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({
    example: 'FLEET_MANAGER',
    description: 'User role',
    enum: ['FLEET_MANAGER', 'STUDENT'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['FLEET_MANAGER', 'STUDENT'])
  role?: UserRole

  @ApiPropertyOptional({ example: 'ae0cc126-df8a-4f57-89f7-a0d8115d2eb2', description: 'College identifier' })
  @IsOptional()
  @IsUUID()
  collegeId?: string

  @ApiPropertyOptional({
    example: 'active',
    description: 'Account status',
    enum: ['active', 'disabled'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'disabled'])
  status?: UserStatus
}
