import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { College } from './college.entity'
import { CollegesService } from './colleges.service'
import { CollegesController } from './colleges.controller'

@Module({
  imports: [TypeOrmModule.forFeature([College])],
  providers: [CollegesService],
  controllers: [CollegesController],
  exports: [CollegesService],
})
export class CollegesModule {}
