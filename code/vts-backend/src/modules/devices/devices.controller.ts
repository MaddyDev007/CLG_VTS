import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { DevicesService } from './devices.service'
import { CreateDeviceDto } from './dto/create-device.dto'
import { UpdateDeviceDto } from './dto/update-device.dto'
import { AssignDeviceDto } from './dto/assign-device.dto'
import { UpdateDeviceIntervalDto } from './dto/update-device-interval.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { Roles } from '../../common/guards/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'
import { DeviceAckService } from '../../mqtt/device-ack.service'
import { DeviceCommandService } from '../../mqtt/device-command.service'

@ApiTags('Devices')
@ApiBearerAuth('access-token')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly deviceCommandService: DeviceCommandService,
    private readonly deviceAckService: DeviceAckService,
  ) {}

  @ApiOperation({ summary: 'List devices' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query('collegeId') collegeId?: string) {
    return this.devicesService.findAll(user, collegeId)
  }

  @ApiOperation({ summary: 'List unassigned devices' })
  @ApiResponse({ status: 200 })
  @Get('unassigned')
  async listUnassigned(@CurrentUser() user: AuthenticatedUser, @Query('collegeId') collegeId?: string) {
    return this.devicesService.listUnassigned(user, collegeId)
  }

  @ApiOperation({ summary: 'Get device by UID' })
  @ApiResponse({ status: 200 })
  @Get('by-uid/:deviceUid')
  async getByUid(@Param('deviceUid') deviceUid: string, @CurrentUser() user: AuthenticatedUser) {
    return this.devicesService.findByUid(deviceUid, user)
  }

  @ApiOperation({ summary: 'Create device' })
  @ApiResponse({ status: 200 })
  @Post()
  async create(
    @Body() payload: CreateDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
    @Query('collegeId') collegeId?: string,
  ) {
    const device = await this.devicesService.create(payload, user, collegeId)
    return { success: true, message: 'Device created', device }
  }

  @ApiOperation({ summary: 'Update device' })
  @ApiResponse({ status: 200 })
  @Put(':deviceId')
  async update(@Param('deviceId') deviceId: string, @Body() payload: UpdateDeviceDto, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.update(deviceId, payload, user)
    return { success: true, message: 'Device updated', device }
  }

  @ApiOperation({ summary: 'Delete device' })
  @ApiResponse({ status: 200 })
  @Delete(':deviceId')
  async remove(@Param('deviceId') deviceId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.devicesService.remove(deviceId, user)
    return { success: true, message: 'Device deleted' }
  }

  @ApiOperation({ summary: 'Update telemetry interval and wait for device ACK' })
  @ApiResponse({ status: 200 })
  @Post(':imei/interval')
  async updateInterval(
    @Param('imei') imei: string,
    @Body() payload: UpdateDeviceIntervalDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const device = await this.devicesService.findByImei(imei, user)
    const sentAt = Date.now()

    await this.deviceCommandService.sendIntervalUpdate(device.imei, payload.interval)

    const ack = await this.deviceAckService.waitForAck(device.imei, payload.interval, sentAt)
    if (!ack) {
      return { status: 'timeout' as const }
    }

    await this.devicesService.updateTelemetryInterval(device.deviceId, ack.interval, user)

    return {
      status: 'success' as const,
      interval: ack.interval,
      timestamp: new Date(ack.timestamp).toISOString(),
    }
  }

  @ApiOperation({ summary: 'Assign device to vehicle' })
  @ApiResponse({ status: 200 })
  @Post(':deviceUid/assign')
  async assign(@Param('deviceUid') deviceUid: string, @Body() payload: AssignDeviceDto, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.assign(deviceUid, payload.vehicleId, payload.vehicleName, user)
    return { success: true, device }
  }

  @ApiOperation({ summary: 'Unassign device' })
  @ApiResponse({ status: 200 })
  @Post(':deviceUid/unassign')
  async unassign(@Param('deviceUid') deviceUid: string, @CurrentUser() user: AuthenticatedUser) {
    const device = await this.devicesService.unassign(deviceUid, user)
    return { success: true, device }
  }
}
