/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../auth/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Productor } from '../productor/productores.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    TypeOrmModule.forFeature([Productor]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // eslint-disable-next-line @typescript-eslint/require-await
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRATION') || 86400, // 1 día por defecto
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
