import { Body, Controller, Post, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { access_token } = await this.authService.signIn(loginDto.email, loginDto.password);
    response.cookie('jwt', access_token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Login successful' };
  }
}

