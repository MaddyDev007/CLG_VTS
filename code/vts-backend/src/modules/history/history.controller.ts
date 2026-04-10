import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { HistoryService } from './history.service'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'

@ApiTags('History')
@ApiBearerAuth('access-token')
@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @ApiOperation({ summary: 'List vehicle history summaries' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.historyService.listVehiclesHistory(user)
  }

  @ApiOperation({ summary: 'Get vehicle history' })
  @ApiResponse({ status: 200 })
  @Get(':vehicleId')
  async get(@Param('vehicleId') vehicleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.historyService.getVehicleHistory(vehicleId, user)
  }

  @ApiOperation({ summary: 'Get vehicle history timeline' })
  @ApiResponse({ status: 200 })
  @Get(':vehicleId/timeline')
  async timeline(@Param('vehicleId') vehicleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.historyService.getTimeline(vehicleId, user)
  }
}
