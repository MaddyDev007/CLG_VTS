import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { NotificationsService } from './notifications.service'
import { CreateNotificationDto } from './dto/create-notification.dto'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'List notifications' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.findAll(user)
  }

  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 200 })
  @Post()
  async create(@Body() payload: CreateNotificationDto) {
    const notification = await this.notificationsService.create(payload)
    return notification
  }

  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200 })
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAsRead(id, user)
    return { success: true }
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200 })
  @Patch('read-all')
  async markAll(@CurrentUser() user: AuthenticatedUser) {
    await this.notificationsService.markAllAsRead(user)
    return { success: true }
  }
}
