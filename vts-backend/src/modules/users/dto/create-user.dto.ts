import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import type { UserRole } from '../user.entity'

type CreateUserRole = Extract<UserRole, 'SUPER_ADMIN' | 'COLLEGE_ADMIN' | 'FLEET_MANAGER' | 'STUDENT'>

export class CreateUserDto {
  @ApiProperty({ example: 'Asha Rao', description: 'Full name' })
  @IsString()
  name!: string

  @ApiProperty({ example: 'asha.rao@example.com', description: 'Email address' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'StrongPassword123', description: 'Login password' })
  @IsString()
  @MinLength(6)
  password!: string

  @ApiProperty({
    example: 'FLEET_MANAGER',
    description: 'User role',
    enum: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER', 'STUDENT'],
  })
  @IsString()
  @IsIn(['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER', 'STUDENT'])
  role!: CreateUserRole

  @ApiPropertyOptional({ example: 'Oxford College', description: 'College name for creating a college admin' })
  @IsOptional()
  @IsString()
  collegeName?: string

  @ApiPropertyOptional({ example: 'ae0cc126-df8a-4f57-89f7-a0d8115d2eb2', description: 'Existing college identifier' })
  @IsOptional()
  @IsUUID()
  collegeId?: string
}
