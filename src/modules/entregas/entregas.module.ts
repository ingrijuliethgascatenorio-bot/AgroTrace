import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EntregasController } from './entregas.controller';
import { EntregasService } from './entregas.service';
import { Entrega } from './entregas.entity';

// Nota: MulterModule ya NO se registra aqui porque cada endpoint
// declara su propio FileInterceptor con su propia configuracion.
// La carpeta de destino se crea automaticamente en el controller.

@Module({
  imports: [TypeOrmModule.forFeature([Entrega])],
  controllers: [EntregasController],
  providers: [EntregasService],
  exports: [EntregasService],
})
export class EntregasModule {}
