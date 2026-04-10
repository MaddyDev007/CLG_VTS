import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { StopEventsFilterDto } from './dto/stop-events-filter.dto'
import { StopEventsService } from './stop-events.service'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'

@ApiTags('Stop Events')
@ApiBearerAuth('access-token')
@Controller('stop-events')
@UseGuards(JwtAuthGuard)
export class StopEventsController {
  constructor(private readonly stopEventsService: StopEventsService) {}

  @ApiOperation({ summary: 'List stop events computed from ignition transitions' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: StopEventsFilterDto) {
    return this.stopEventsService.list(user, query)
  }
}
