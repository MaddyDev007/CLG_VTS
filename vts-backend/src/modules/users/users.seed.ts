import { Injectable, OnModuleInit } from '@nestjs/common'
import { UsersService } from './users.service'

@Injectable()
export class UsersSeeder implements OnModuleInit {
  constructor(private readonly usersService: UsersService) {}

  async onModuleInit() {
    const existing = await this.usersService.findByEmail('admin@vts.local')
    if (existing) {
      return
    }

    await this.usersService.create({
      name: 'Super Admin',
      email: 'admin@vts.local',
      password: 'admin123',
      role: 'SUPER_ADMIN',
    }, {
      userId: 'system',
      role: 'SUPER_ADMIN',
      name: 'Seeder',
      collegeId: null,
      status: 'active',
    })
  }
}
