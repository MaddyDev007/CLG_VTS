import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { VehiclesService } from './vehicles.service'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { TripsService } from '../trips/trips.service'
import { TelemetryService } from '../telemetry/telemetry.service'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { Roles } from '../../common/guards/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'
import { ListVehiclesDto } from './dto/list-vehicles.dto'

@ApiTags('Vehicles')
@ApiBearerAuth('access-token')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly tripsService: TripsService,
    private readonly telemetryService: TelemetryService,
  ) {}

  @ApiOperation({ summary: 'List vehicles' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListVehiclesDto) {
    return this.vehiclesService.findAll(user, query)
  }

  @ApiOperation({ summary: 'Vehicle status counts' })
  @ApiResponse({ status: 200 })
  @Get('status-counts')
  async statusCounts(@CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.getStatusCounts(user)
  }

  @ApiOperation({ summary: 'Get vehicle by id' })
  @ApiResponse({ status: 200 })
  @Get(':vehicleId')
  async get(@Param('vehicleId') vehicleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.vehiclesService.findById(vehicleId, user)
  }

  @ApiOperation({ summary: 'Get vehicle trips' })
  @ApiResponse({ status: 200 })
  @Get(':vehicleId/trips')
  async trips(@Param('vehicleId') vehicleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tripsService.findByVehicle(vehicleId, user)
  }

  @ApiOperation({ summary: 'Get vehicle telemetry' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Get(':vehicleId/telemetry')
  async telemetry(@Param('vehicleId') vehicleId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.telemetryService.getByVehicle(vehicleId, user)
  }

  @ApiOperation({ summary: 'Create vehicle' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Post()
  async create(
    @Body() payload: CreateVehicleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('collegeId') collegeId?: string,
  ) {
    const vehicle = await this.vehiclesService.create(payload, user, collegeId)
    return { success: true, message: 'Vehicle created', vehicle }
  }

  @ApiOperation({ summary: 'Update vehicle' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Put(':vehicleId')
  async update(@Param('vehicleId') vehicleId: string, @Body() payload: UpdateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    const vehicle = await this.vehiclesService.update(vehicleId, payload, user)
    return { success: true, message: 'Vehicle updated', vehicle }
  }

  @ApiOperation({ summary: 'Patch vehicle' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Patch(':vehicleId')
  async patch(@Param('vehicleId') vehicleId: string, @Body() payload: UpdateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    const vehicle = await this.vehiclesService.update(vehicleId, payload, user)
    return { success: true, message: 'Vehicle updated', vehicle }
  }

  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiResponse({ status: 200 })
  @Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
  @Delete(':vehicleId')
  async remove(@Param('vehicleId') vehicleId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.vehiclesService.remove(vehicleId, user)
    return { success: true, message: 'Vehicle deleted' }
  }
}
