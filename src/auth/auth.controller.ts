import { Body, Controller, Post, HttpCode, HttpStatus, Res, Get, UseGuards, Request, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.service';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { access_token, user } = await this.authService.signIn(loginDto.email, loginDto.password);
    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      path: '/',
    });
    return { 
      message: 'Login successful',
      user: user // Return user details for frontend redirection
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwt');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const userEntity = await this.authService.getUserById(user.sub);
    
    let tenantName: string | null = null;
    if (user.tenantId) {
      try {
        const tenant = await this.adminService.getTenantById(user.tenantId);
        tenantName = tenant.name;
      } catch (e) {
        console.error('Failed to fetch tenant for profile', e);
      }
    }

    return {
      ...user,
      name: userEntity.fullName,
      email: userEntity.email,
      tenantId: user.tenantId,
      tenantRole: user.tenantRole,
      tenantName: tenantName
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() updateData: any) {
    return this.authService.updateProfile(user.sub, updateData);
  }
}

