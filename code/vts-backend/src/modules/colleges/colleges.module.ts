import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { College } from './college.entity'
import { CollegesService } from './colleges.service'
import { CollegesController } from './colleges.controller'
import { User } from '../users/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([College, User])],
  providers: [CollegesService],
  controllers: [CollegesController],
  exports: [CollegesService],
})
export class CollegesModule {}
