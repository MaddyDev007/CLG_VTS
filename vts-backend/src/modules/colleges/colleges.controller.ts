import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CollegesService } from './colleges.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto'

@ApiTags('Colleges')
@ApiBearerAuth('access-token')
@Controller('colleges')
@UseGuards(JwtAuthGuard)
export class CollegesController {
  constructor(private readonly collegesService: CollegesService) {}

  @ApiOperation({ summary: 'List colleges' })
  @ApiResponse({ status: 200 })
  @Get()
  async list(@CurrentUser() user: AuthenticatedUser, @Query('includeAll') includeAll?: string) {
    return this.collegesService.findAll(user, includeAll === 'true')
  }

  @ApiOperation({ summary: 'Update college status' })
  @ApiResponse({ status: 200 })
  @Patch(':collegeId/status')
  async updateStatus(
    @Param('collegeId') collegeId: string,
    @Body() payload: UpdateCollegeStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const college = await this.collegesService.updateStatus(collegeId, payload, user)
    return { success: true, college }
  }

  @ApiOperation({ summary: 'Delete college' })
  @ApiResponse({ status: 200 })
  @Delete(':collegeId')
  async remove(@Param('collegeId') collegeId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.collegesService.remove(collegeId, user)
    return { success: true }
  }
}
