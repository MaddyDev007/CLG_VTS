import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsUUID } from 'class-validator'
import type { UserRole } from '../user.entity'

export class ListUsersDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  collegeId?: string

  @ApiPropertyOptional({
    enum: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER', 'STUDENT'],
  })
  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER', 'STUDENT'])
  role?: UserRole
}
