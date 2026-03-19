import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { ProfilePreferences } from './profile-preferences.entity'
import { UsersModule } from '../users/users.module'
import { College } from '../colleges/college.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ProfilePreferences, College]), UsersModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
