import { Module } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'

// Controllers
import { CriarMecanicoController } from './controllers/mecanicos/criar-mecanico.controller.js'
import { CriarClienteController } from './controllers/clientes/criar-cliente.controller.js'
import { CriarVeiculoController } from './controllers/veiculos/criar-veiculo.controller.js'
import { ListarClientesController } from './controllers/clientes/listar-clientes.controller.js'
import { EditarClienteController } from './controllers/clientes/editar-cliente.controller.js'
import { DeletarClienteController } from './controllers/clientes/deletar-cliente.controller.js'

// Use Cases
import { CriarMecanicoUseCase } from '@/modules/os-orcamento/application/use-cases/mecanicos/criar-mecanico.js'
import { CriarClienteUseCase } from '@/modules/os-orcamento/application/use-cases/clientes/criar-cliente.js'
import { CriarVeiculoUseCase } from '@/modules/os-orcamento/application/use-cases/veiculos/criar-veiculo.js'
import { ListarClientesUseCase } from './application/use-cases/clientes/listar-clientes.js'
import { EditarClienteUseCase } from './application/use-cases/clientes/editar-cliente.js'
import { DeletarClienteUseCase } from './application/use-cases/clientes/deletar-cliente.js'

// Repositories (Domain Contracts)
import { MecanicoRepository } from '@/modules/os-orcamento/domain/repositories/mecanicos-repository.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'

// Prisma Repositories (Infra Implementations)
import { PrismaMecanicoRepository } from '@/infra/database/prisma/repositories/prisma-mecanico.repository.js'
import { PrismaClienteRepository } from '@/infra/database/prisma/repositories/prisma-cliente.repository.js'
import { PrismaVeiculoRepository } from '@/infra/database/prisma/repositories/prisma-veiculo.repository.js'

@Module({
  controllers: [
    CriarMecanicoController,
    CriarClienteController,
    CriarVeiculoController,
    ListarClientesController,
    EditarClienteController,
    DeletarClienteController,
  ],
  providers: [
    // Database Service
    PrismaService,

    // Use Cases
    CriarMecanicoUseCase,
    CriarClienteUseCase,
    CriarVeiculoUseCase,
    ListarClientesUseCase,
    EditarClienteUseCase,
    DeletarClienteUseCase,

    // Inversão de Dependência dos Repositórios (Domínio -> Infra)
    {
      provide: MecanicoRepository,
      useClass: PrismaMecanicoRepository,
    },
    {
      provide: ClienteRepository,
      useClass: PrismaClienteRepository,
    },
    {
      provide: VeiculoRepository,
      useClass: PrismaVeiculoRepository,
    },
  ],
})
export class OsOrcamentoModule { }