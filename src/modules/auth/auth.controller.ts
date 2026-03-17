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
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard, Roles } from './roles.guard';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── POST /api/auth/register ─────────────────────────────
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const { usuario, token } = await this.authService.register(registerDto);
    return { mensaje: 'Usuario registrado correctamente', usuario, token };
  }

  // ── POST /api/auth/login ────────────────────────────────
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { usuario, token } = await this.authService.login(loginDto);
    return { mensaje: 'Login exitoso', usuario, token };
  }

  // ── GET /api/me — perfil del usuario autenticado ────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { password, ...usuario } = req.user;
    return usuario;
  }

  // ── GET /api/admin/info — solo ADMIN ────────────────────
  @Get('admin/info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getAdminInfo() {
    return { mensaje: 'Acceso de administrador confirmado' };
  }

  // ── GET /api/operario/info — solo OPERARIO ──────────────
  @Get('operario/info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OPERARIO')
  getOperarioInfo() {
    return { mensaje: 'Acceso de operario confirmado' };
  }

  // ── GET /api/productor/info — solo PRODUCTOR ────────────
  @Get('productor/info')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PRODUCTOR')
  getProductorInfo() {
    return { mensaje: 'Acceso de productor confirmado' };
  }
}
