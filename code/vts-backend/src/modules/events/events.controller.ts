import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { EventsService } from './events.service'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'

@ApiTags('Events')
@ApiBearerAuth('access-token')
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({ summary: 'List overspeed events' })
  @ApiResponse({ status: 200 })
  @Get('overspeed')
  async listOverspeed(@CurrentUser() user: AuthenticatedUser, @Query() query: any) {
    return this.eventsService.listOverspeed(user, {
      vehicleId: query.vehicleId,
      speedLimit: query.speedLimit ? Number(query.speedLimit) : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
    })
  }

  @ApiOperation({ summary: 'Get overspeed event' })
  @ApiResponse({ status: 200 })
  @Get('overspeed/:id')
  async getOverspeed(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getOverspeed(id, user)
  }

  @ApiOperation({ summary: 'Overspeed playback' })
  @ApiResponse({ status: 200 })
  @Get('overspeed/:id/playback')
  async overspeedPlayback(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getOverspeedPlayback(id, user)
  }

  @ApiOperation({ summary: 'List idling events' })
  @ApiResponse({ status: 200 })
  @Get('idling')
  async listIdling(@CurrentUser() user: AuthenticatedUser, @Query() query: any) {
    return this.eventsService.listIdling(user, {
      vehicleId: query.vehicleId,
      minDuration: query.minDuration ? Number(query.minDuration) : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
    })
  }

  @ApiOperation({ summary: 'Get idling event' })
  @ApiResponse({ status: 200 })
  @Get('idling/:id')
  async getIdling(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getIdling(id, user)
  }

  @ApiOperation({ summary: 'Idling playback' })
  @ApiResponse({ status: 200 })
  @Get('idling/:id/playback')
  async idlingPlayback(@Param('id') id: string) {
    void id
    return []
  }

  @ApiOperation({ summary: 'List stop events' })
  @ApiResponse({ status: 200 })
  @Get('stop')
  async listStop(@CurrentUser() user: AuthenticatedUser, @Query() query: any) {
    return this.eventsService.listStops(user, {
      vehicleId: query.vehicleId,
      minDuration: query.minDuration ? Number(query.minDuration) : undefined,
      maxDuration: query.maxDuration ? Number(query.maxDuration) : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
    })
  }

  @ApiOperation({ summary: 'Get stop event' })
  @ApiResponse({ status: 200 })
  @Get('stop/:id')
  async getStop(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getStop(id, user)
  }

  @ApiOperation({ summary: 'Stop playback' })
  @ApiResponse({ status: 200 })
  @Get('stop/:id/playback')
  async stopPlayback(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.eventsService.getStopPlayback(id, user)
  }
}
