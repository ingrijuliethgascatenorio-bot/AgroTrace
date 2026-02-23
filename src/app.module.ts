import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisisModule } from './analisis/analisis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'TU_PASSWORD_AQUI',
      database: 'AgroTrace',
      autoLoadEntities: true,
      synchronize: false,
    }),
    AnalisisModule,
  ],
})
export class AppModule {}
