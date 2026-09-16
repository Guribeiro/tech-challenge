import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, PrismaHealthIndicator } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/infra/database/prisma/prisma.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) { }

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Checagem de saúde da aplicação',
    description: 'Valida se o serviço e a conexão com o banco de dados PostgreSQL estão ativos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Aplicação e banco de dados operacionais.',
    schema: {
      example: {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Um ou mais serviços insalubres (ex: banco de dados inacessível).',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: { database: { status: 'down', message: 'Connection failed' } },
        details: { database: { status: 'down', message: 'Connection failed' } },
      },
    },
  })
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prisma),
    ]);
  }
}