import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ProfileService } from './profile.service'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Get current profile' })
  @ApiResponse({ status: 200 })
  @Get()
  async getProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user.userId)
  }

  @ApiOperation({ summary: 'Get preferences' })
  @ApiResponse({ status: 200 })
  @Get('preferences')
  async getPreferences(@Req() req: any) {
    return this.profileService.getPreferences(req.user.userId)
  }

  @ApiOperation({ summary: 'Update preferences' })
  @ApiResponse({ status: 200 })
  @Patch('preferences')
  async updatePreferences(@Req() req: any, @Body() payload: UpdatePreferencesDto) {
    const prefs = await this.profileService.updatePreferences(req.user.userId, payload)
    return { success: true, message: 'Preferences updated', preferences: prefs }
  }

  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200 })
  @Patch()
  async updateProfile(@Req() req: any, @Body() payload: { name?: string }) {
    return this.profileService.updateProfile(req.user.userId, payload)
  }

  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200 })
  @Post('change-password')
  async changePassword(@Req() req: any, @Body() payload: ChangePasswordDto) {
    await this.profileService.changePassword(req.user.userId, payload)
    return { success: true, message: 'Password updated' }
  }
}
