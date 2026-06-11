import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CollegesService } from './colleges.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/auth/current-user.decorator'
import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface'
import { CreateCollegeDto } from './dto/create-college.dto'
import { UpdateCollegeStatusDto } from './dto/update-college-status.dto'
import { UpdateCollegeDto } from './dto/update-college.dto'

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

  @ApiOperation({ summary: 'Create college' })
  @ApiResponse({ status: 200 })
  @Post()
  async create(@Body() payload: CreateCollegeDto, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.collegesService.create(payload, user)
    return { success: true, ...result }
  }

  @ApiOperation({ summary: 'Get college details' })
  @ApiResponse({ status: 200 })
  @Get(':collegeId')
  async get(@Param('collegeId') collegeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.collegesService.findDetailedById(collegeId, user)
  }

  @ApiOperation({ summary: 'Update college details' })
  @ApiResponse({ status: 200 })
  @Patch(':collegeId')
  async update(
    @Param('collegeId') collegeId: string,
    @Body() payload: UpdateCollegeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.collegesService.update(collegeId, payload, user)
    return { success: true, ...result }
  }

  @ApiOperation({ summary: 'Reset college admin password' })
  @ApiResponse({ status: 200 })
  @Post(':collegeId/reset-admin-password')
  async resetAdminPassword(@Param('collegeId') collegeId: string, @CurrentUser() user: AuthenticatedUser) {
    const result = await this.collegesService.resetAdminPassword(collegeId, user)
    return { success: true, ...result }
  }

  @ApiOperation({ summary: 'Request college deletion' })
  @ApiResponse({ status: 200 })
  @Patch(':collegeId/request-delete')
  async requestDelete(@Param('collegeId') collegeId: string, @CurrentUser() user: AuthenticatedUser) {
    const college = await this.collegesService.requestDelete(collegeId, user)
    return { success: true, college }
  }

  @ApiOperation({ summary: 'Cancel college deletion request' })
  @ApiResponse({ status: 200 })
  @Patch(':collegeId/cancel-delete')
  async cancelDelete(@Param('collegeId') collegeId: string, @CurrentUser() user: AuthenticatedUser) {
    const college = await this.collegesService.cancelDelete(collegeId, user)
    return { success: true, college }
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
