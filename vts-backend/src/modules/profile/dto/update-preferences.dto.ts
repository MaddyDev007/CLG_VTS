import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

class NotificationPreferencesDto {
  @ApiProperty({ example: true, description: 'Notify on overspeeding' })
  @IsBoolean()
  overspeed!: boolean

  @ApiProperty({ example: true, description: 'Notify on idling' })
  @IsBoolean()
  idling!: boolean

  @ApiProperty({ example: false, description: 'Notify on geofence events' })
  @IsBoolean()
  geofence!: boolean

  @ApiProperty({ example: true, description: 'Notify on stops' })
  @IsBoolean()
  stop!: boolean

  @ApiProperty({ example: true, description: 'Notify when device goes offline' })
  @IsBoolean()
  deviceOffline!: boolean
}

export class UpdatePreferencesDto {
  @ApiProperty({ example: 'Asia/Kolkata', description: 'IANA timezone' })
  @IsString()
  timezone!: string

  @ApiProperty({
    type: NotificationPreferencesDto,
    example: {
      overspeed: true,
      idling: true,
      geofence: false,
      stop: true,
      deviceOffline: true,
    },
    description: 'Notification preferences',
  })
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  preferences!: NotificationPreferencesDto
}
