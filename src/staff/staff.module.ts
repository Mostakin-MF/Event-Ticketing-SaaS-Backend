import { Module } from '@nestjs/common';
import { User_3_Controller } from './staff.controller';
import { User_3_Entity } from './User_3.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User_3_Service } from './staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([User_3_Entity])],
  controllers: [User_3_Controller],
  providers: [User_3_Service],
})
export class StaffModule {}
