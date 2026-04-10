import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { GeofencesService } from './geofences.service'
import { CreateGeofenceDto } from './dto/create-geofence.dto'
import { UpdateGeofenceDto } from './dto/update-geofence.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { Roles } from '../../common/guards/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'

@ApiTags('Geofences')
@ApiBearerAuth('access-token')
@Controller('geofences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeofencesController {
  constructor(private readonly geofencesService: GeofencesService) {}

  @ApiOperation({ summary: 'List geofences' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query('collegeId') collegeId?: string) {
    return this.geofencesService.findAll(user, collegeId)
  }

  @ApiOperation({ summary: 'Get geofence by id' })
  @ApiResponse({ status: 200 })
  @Get('stops')
  async stops(@CurrentUser() user: AuthenticatedUser, @Query('collegeId') collegeId?: string) {
    return this.geofencesService.listStops(user, collegeId)
  }

  @ApiOperation({ summary: 'Get geofence by id' })
  @ApiResponse({ status: 200 })
  @Get(':geofenceId')
  async get(@Param('geofenceId') geofenceId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.geofencesService.findById(geofenceId, user)
  }

  @ApiOperation({ summary: 'Create geofence' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Post()
  async create(
    @Body() payload: CreateGeofenceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('collegeId') collegeId?: string,
  ) {
    const geofence = await this.geofencesService.create(payload, user, collegeId)
    return { success: true, message: 'Geofence created', geofence }
  }

  @ApiOperation({ summary: 'Update geofence' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Put(':geofenceId')
  async update(@Param('geofenceId') geofenceId: string, @Body() payload: UpdateGeofenceDto, @CurrentUser() user: AuthenticatedUser) {
    const geofence = await this.geofencesService.update(geofenceId, payload, user)
    return { success: true, message: 'Geofence updated', geofence }
  }

  @ApiOperation({ summary: 'Delete geofence' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Delete(':geofenceId')
  async remove(@Param('geofenceId') geofenceId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.geofencesService.remove(geofenceId, user)
    return { success: true, message: 'Geofence deleted' }
  }
}
