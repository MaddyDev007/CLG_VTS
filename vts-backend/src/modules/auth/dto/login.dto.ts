import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'User email address' })
  @IsEmail()
  email!: string

  @ApiProperty({ example: 'StrongPassword123', description: 'User password' })
  @IsString()
  password!: string
}
