import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service.js'

// Interfaces (Abstrações do Domínio)
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { MecanicoRepository } from '@/modules/os-orcamento/domain/repositories/mecanicos-repository.js'
import { UsuariosRepository } from '@/modules/autenticacao/domain/repositories/usuarios-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'

// Implementações Concretas (Infra Prisma)
import { PrismaClienteRepository } from './prisma/repositories/prisma-cliente.repository.js'
import { PrismaMecanicoRepository } from './prisma/repositories/prisma-mecanico.repository.js'
import { PrismaUsuarioRepository } from './prisma/repositories/prisma-usuario.repository.js'
import { PrismaVeiculoRepository } from './prisma/repositories/prisma-veiculo.repository.js'

@Module({
  providers: [
    PrismaService,
    {
      provide: ClienteRepository,
      useClass: PrismaClienteRepository,
    },
    {
      provide: MecanicoRepository,
      useClass: PrismaMecanicoRepository,
    },
    {
      provide: UsuariosRepository,
      useClass: PrismaUsuarioRepository,
    },
    {
      provide: VeiculoRepository,
      useClass: PrismaVeiculoRepository,
    },
  ],
  exports: [
    PrismaService,
    ClienteRepository,
    MecanicoRepository,
    UsuariosRepository,
    VeiculoRepository,
  ],
})
export class DatabaseModule { }