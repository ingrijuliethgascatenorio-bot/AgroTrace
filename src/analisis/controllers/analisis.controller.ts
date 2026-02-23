import { Controller, Get } from '@nestjs/common';

@Controller('analisis')
export class AnalisisController {
  @Get('ping')
  ping() {
    return { message: 'Modulo analisis funcionando' };
  }
}
