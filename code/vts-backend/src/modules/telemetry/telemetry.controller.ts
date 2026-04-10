import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TelemetryService } from './telemetry.service'
import { TelemetryFilterDto } from './dto/telemetry-filter.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CreateTelemetryDto } from './dto/create-telemetry.dto'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { Roles } from '../../common/guards/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'

@ApiTags('Telemetry')
@Controller('telemetry')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @ApiOperation({ summary: 'List telemetry' })
  @ApiResponse({ status: 200 })
  @ApiBearerAuth('access-token')
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() filters: TelemetryFilterDto) {
    return this.telemetryService.list(user, filters)
  }

  @ApiOperation({ summary: 'Ingest telemetry (HTTP)' })
  @ApiResponse({ status: 201 })
  @ApiBearerAuth('access-token')
  @Post()
  async ingest(@Body() payload: CreateTelemetryDto) {
    return this.telemetryService.ingest(payload)
  }
}
