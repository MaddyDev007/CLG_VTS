import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import type { UserRole } from '../user.entity'

type CreateUserRole = Extract<UserRole, 'FLEET_MANAGER' | 'STUDENT'>

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
    enum: ['FLEET_MANAGER', 'STUDENT'],
  })
  @IsString()
  @IsIn(['FLEET_MANAGER', 'STUDENT'])
  role!: CreateUserRole

  @ApiPropertyOptional({ example: 'ae0cc126-df8a-4f57-89f7-a0d8115d2eb2', description: 'Existing college identifier' })
  @IsOptional()
  @IsUUID()
  collegeId?: string
}
