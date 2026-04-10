import { ApiProperty } from '@nestjs/swagger'
import { IsIn } from 'class-validator'

export class UpdateCollegeStatusDto {
  @ApiProperty({
    enum: ['active', 'inactive'],
  })
  @IsIn(['active', 'inactive'])
  status!: 'active' | 'inactive'
}
