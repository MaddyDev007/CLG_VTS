import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RoutesService } from './routes.service'
import { CreateRouteDto } from './dto/create-route.dto'
import { UpdateRouteDto } from './dto/update-route.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'

@ApiTags('Routes')
@ApiBearerAuth('access-token')
@Controller('routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @ApiOperation({ summary: 'List routes' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.routesService.findAll(user)
  }

  @ApiOperation({ summary: 'Get route by id' })
  @ApiResponse({ status: 200 })
  @Get(':routeId')
  async get(@Param('routeId') routeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.routesService.findById(routeId, user)
  }

  @ApiOperation({ summary: 'List vehicles assigned to route' })
  @ApiResponse({ status: 200 })
  @Get(':routeId/vehicles')
  async listVehicles(@Param('routeId') routeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.routesService.listVehicles(routeId, user)
  }

  @ApiOperation({ summary: 'Create route' })
  @ApiResponse({ status: 200 })
  @Post()
  async create(@Body() payload: CreateRouteDto, @CurrentUser() user: AuthenticatedUser) {
    const route = await this.routesService.create(payload, user)
    return { success: true, message: 'Route created', route }
  }

  @ApiOperation({ summary: 'Update route' })
  @ApiResponse({ status: 200 })
  @Patch(':routeId')
  async update(@Param('routeId') routeId: string, @Body() payload: UpdateRouteDto, @CurrentUser() user: AuthenticatedUser) {
    const route = await this.routesService.update(routeId, payload, user)
    return { success: true, message: 'Route updated', route }
  }

  @ApiOperation({ summary: 'Delete route' })
  @ApiResponse({ status: 200 })
  @Delete(':routeId')
  async remove(@Param('routeId') routeId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.routesService.remove(routeId, user)
    return { success: true, message: 'Route deleted' }
  }
}
