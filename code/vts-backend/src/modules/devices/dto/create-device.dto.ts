import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, Length, Matches } from 'class-validator'

export class CreateDeviceDto {

  @ApiProperty({ example: 'DEV_0001', description: 'Unique device identifier' })
  @IsString()
  @IsNotEmpty({ message: 'deviceId is required' })
  @Length(3, 32, { message: 'deviceId must be between 3 and 32 characters' })
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'deviceId can only contain uppercase letters, numbers and underscore'
  })
  deviceId!: string


  @ApiProperty({ example: '123456789012345', description: 'IMEI (15 digits)' })
  @IsString()
  @IsNotEmpty({ message: 'imei is required' })
  @Matches(/^[0-9]{15}$/, {
    message: 'imei must be exactly 15 digits'
  })
  imei!: string
}
