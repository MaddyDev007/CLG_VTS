import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'
import { UsersSeeder } from './users.seed'
import { User } from './user.entity'
import { College } from '../colleges/college.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, College])],
  controllers: [UsersController],
  providers: [UsersService, UsersSeeder],
  exports: [UsersService],
})
export class UsersModule {}
