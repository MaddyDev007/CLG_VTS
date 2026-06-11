import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProfilePreferences } from './profile-preferences.entity'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'
import { UsersService } from '../users/users.service'
import { College } from '../colleges/college.entity'
import { User } from '../users/user.entity'
import { comparePassword, hashPassword } from '../../common/utils/password.util'
import { ChangePasswordDto } from './dto/change-password.dto'

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfilePreferences)
    private readonly prefRepo: Repository<ProfilePreferences>,
    private readonly usersService: UsersService,
    @InjectRepository(College)
    private readonly collegesRepo: Repository<College>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId)
    const college = user.collegeId
      ? await this.collegesRepo.findOne({ where: { id: user.collegeId } })
      : null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      collegeId: user.collegeId ?? null,
      collegeName: college?.name ?? null,
      mustChangePassword: user.mustChangePassword,
    }
  }

  async getPreferences(userId: string) {
    let prefs = await this.prefRepo.findOne({ where: { userId } })

    if (!prefs) {
      prefs = this.prefRepo.create({
        userId,
        timezone: 'Asia/Kolkata',
        preferences: {
          overspeed: true,
          idling: true,
          geofence: true,
          stop: true,
          deviceOffline: true,
        },
      })
      prefs = await this.prefRepo.save(prefs)
    }

    return prefs
  }

  async updatePreferences(userId: string, payload: UpdatePreferencesDto) {
    const current = await this.getPreferences(userId)
    current.timezone = payload.timezone
    current.preferences = payload.preferences
    return this.prefRepo.save(current)
  }

  async updateProfile(userId: string, payload: { name?: string }) {
    if (payload.name) {
      const user = await this.usersService.findById(userId)
      await this.usersService.update(
        userId,
        { name: payload.name },
        {
          userId: user.id,
          role: user.role,
          name: user.name,
          collegeId: user.collegeId ?? null,
          status: user.status,
        },
      )
    }
    return { success: true }
  }

  async changePassword(userId: string, payload: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    const currentPasswordValid = await comparePassword(payload.currentPassword, user.passwordHash)
    if (!currentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.')
    }

    if (payload.currentPassword === payload.newPassword) {
      throw new BadRequestException('New password must be different from the current password.')
    }

    user.passwordHash = await hashPassword(payload.newPassword)
    user.mustChangePassword = false
    await this.usersRepo.save(user)
  }
}
