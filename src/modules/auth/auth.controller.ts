// src/modules/auth/auth.controller.ts  — REEMPLAZA el archivo existente
import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    const asociacionId = (req as any).asociacionId as number;
    return this.authService.register(dto, asociacionId);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const asociacionId = (req as any).asociacionId as number;
    return this.authService.login(dto, asociacionId);
  }
}
