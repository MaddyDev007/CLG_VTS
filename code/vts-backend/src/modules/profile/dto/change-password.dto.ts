import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123', description: 'Current account password' })
  @IsString()
  currentPassword!: string

  @ApiProperty({ example: 'NewStrongPassword123', description: 'New account password' })
  @IsString()
  @MinLength(6)
  newPassword!: string
}
