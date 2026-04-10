import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TripsController } from './trips.controller'
import { TripsService } from './trips.service'
import { Trip } from './trip.entity'
import { TripPlaybackPoint } from './trip-playback.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripPlaybackPoint])],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
