import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProfilePreferences } from './profile-preferences.entity'
import { UpdatePreferencesDto } from './dto/update-preferences.dto'
import { UsersService } from '../users/users.service'
import { College } from '../colleges/college.entity'

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(ProfilePreferences)
    private readonly prefRepo: Repository<ProfilePreferences>,
    private readonly usersService: UsersService,
    @InjectRepository(College)
    private readonly collegesRepo: Repository<College>,
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
}
