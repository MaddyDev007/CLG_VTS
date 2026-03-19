import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TripsService } from './trips.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@Controller('trips')
@UseGuards(JwtAuthGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @ApiOperation({ summary: 'List trips' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.findAll(user)
  }

  @ApiOperation({ summary: 'Get trip by id' })
  @ApiResponse({ status: 200 })
  @Get(':tripId')
  async get(@Param('tripId') tripId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.findById(tripId, user)
  }

  @ApiOperation({ summary: 'Get trip playback' })
  @ApiResponse({ status: 200 })
  @Get(':tripId/playback')
  async playback(@Param('tripId') tripId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.getPlayback(tripId, user)
  }
}
