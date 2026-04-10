import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { hashPassword } from '../../common/utils/password.util'
import { User } from './user.entity'
import { UsersService } from './users.service'

@Injectable()
export class UsersSeeder implements OnModuleInit {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const existing = await this.usersService.findByEmail('admin@vts.local')
    if (existing) {
      return
    }

    const user = this.usersRepo.create({
      name: 'Super Admin',
      email: 'admin@vts.local',
      passwordHash: await hashPassword('admin123'),
      role: 'SUPER_ADMIN',
      collegeId: null,
      status: 'active',
    })

    await this.usersRepo.save(user)
  }
}
