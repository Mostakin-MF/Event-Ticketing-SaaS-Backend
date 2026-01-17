import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminModule } from '../admin/admin.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendeeEntity } from '../attendee/attendee.entity';

@Module({
  imports: [
    AdminModule,
    TypeOrmModule.forFeature([AttendeeEntity]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard],
})
export class AuthModule { }
