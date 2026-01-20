import { Body, Controller, Post, HttpCode, HttpStatus, Res, Get, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminService } from '../admin/admin.service';
import { LoginDto } from './login.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Public } from './public.decorator';
import { RegisterAttendeeDto } from './register-attendee.dto';
import { PusherService } from '../pusher/pusher.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly adminService: AdminService,
    private readonly pusherService: PusherService,
  ) { }

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

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterAttendeeDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    // Fetch fresh user data from database using ID from token payload
    // req.user.sub contains the user ID
    const user = await this.adminService.getUserById(req.user.sub);

    // Map to expected frontend format and exclude sensitive data
    return {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: req.user.role, // Use role from token or maybe fetch fresh? Token is safer for consistency with guards.
      isPlatformAdmin: user.isPlatformAdmin,
      // Add other fields if needed
    };
  }

  /**
   * Authenticate Pusher private channels
   * This endpoint is called by Pusher when a client tries to subscribe to a private channel
   */
  @UseGuards(JwtAuthGuard)
  @Post('pusher/auth')
  async pusherAuth(@Body() body: any, @Request() req) {
    const { socket_id, channel_name } = body;
    const user = req.user;

    if (!socket_id || !channel_name) {
      throw new UnauthorizedException('Missing socket_id or channel_name');
    }

    try {
      const auth = this.pusherService.authenticateChannel(socket_id, channel_name, user);
      return auth;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Not authorized for this channel');
    }
  }
}

