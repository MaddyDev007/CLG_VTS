import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { UpdateUserStatusDto } from './dto/update-user-status.dto'
import { Roles } from '../../common/guards/roles.decorator'
import { RolesGuard } from '../../common/guards/roles.guard'
import { ListUsersDto } from './dto/list-users.dto'

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FLEET_MANAGER')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListUsersDto) {
    return this.usersService.findAll(user, query)
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200 })
  @Get(':userId')
  async get(@Param('userId') userId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findDetailedById(userId, user)
  }

  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 200 })
  @Post()
  async create(@Body() payload: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const created = await this.usersService.create(payload, user)
    return { success: true, user: created }
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200 })
  @Patch(':userId')
  async update(@Param('userId') userId: string, @Body() payload: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    const updated = await this.usersService.update(userId, payload, user)
    return { success: true, user: updated }
  }

  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Forbidden when managing self or equal/higher role.' })
  @Patch(':userId/status')
  async updateStatus(
    @Param('userId') userId: string,
    @Body() payload: UpdateUserStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const updated = await this.usersService.updateStatus(userId, payload, user)
    return { success: true, user: updated }
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403, description: 'Forbidden when managing self or equal/higher role.' })
  @Delete(':userId')
  async remove(@Param('userId') userId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.usersService.remove(userId, user)
    return { success: true }
  }
}
