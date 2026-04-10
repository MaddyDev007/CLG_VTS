import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsString } from 'class-validator'
import type { UserStatus } from '../user.entity'

export class UpdateUserStatusDto {
  @ApiProperty({
    example: 'disabled',
    description: 'Account status',
    enum: ['active', 'disabled'],
  })
  @IsString()
  @IsIn(['active', 'disabled'])
  status!: UserStatus
}
