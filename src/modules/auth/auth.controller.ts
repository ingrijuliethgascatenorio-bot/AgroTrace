/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard'; // ← sin /guards/
@Controller() // ← sin 'auth' aquí
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const { usuario, token } = await this.authService.register(registerDto);
    return { mensaje: 'Usuario registrado correctamente', usuario, token };
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { usuario, token } = await this.authService.login(loginDto);
    return { mensaje: 'Login exitoso', usuario, token };
  }

  @Get('me') // ← este es el que falta
  @UseGuards(JwtAuthGuard)
  // eslint-disable-next-line @typescript-eslint/require-await
  async getMe(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { password, ...usuario } = req.user;
    return usuario;
  }
}
