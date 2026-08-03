import { forwardRef, Module } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'

// Controllers
import { CriarMecanicoController } from './controllers/mecanicos/criar-mecanico.controller.js'

import { CriarRecepcionistaController } from './controllers/recepcionistas/criar-recepcionista.controller.js'

import { CriarClienteController } from './controllers/clientes/criar-cliente.controller.js'
import { ListarClientesController } from './controllers/clientes/listar-clientes.controller.js'
import { EditarClienteController } from './controllers/clientes/editar-cliente.controller.js'
import { DeletarClienteController } from './controllers/clientes/deletar-cliente.controller.js'

import { CriarVeiculoController } from './controllers/veiculos/criar-veiculo.controller.js'
import { DeletarVeiculoController } from './controllers/veiculos/deletar-veiculo.controller.js'
import { ListarVeiculosController } from './controllers/veiculos/listar-veiculos.controller.js'
import { EditarVeiculoController } from './controllers/veiculos/editar-veiculo.controller.js'

import { CriarServicoController } from './controllers/servicos/criar-servico.controller.js'
import { ListarServicosController } from './controllers/servicos/listar-servicos.controller.js'
import { DesativarServicoController } from './controllers/servicos/desativar-servico.controller.js'
import { ReativarServicoController } from './controllers/servicos/reativar-servico.controller.js'
import { EditarServicoController } from './controllers/servicos/editar-servico.controller.js'
import { CalcularTempoMedioExecucaoServicosController } from './controllers/ordem-servico/calcular-tempo-media-execucao.controller.js'

import { CriarOrdemServicoController } from './controllers/ordem-servico/criar-ordem-servico.controller.js'
import { ObterFilaTrabalhoController } from './controllers/ordem-servico/obter-fila-trabalho.controller.js'
import { IniciarDiagnosticoController } from './controllers/ordem-servico/iniciar-diagnostico.controller.js'

import { ConcluirDiagnosticoController } from './controllers/ordem-servico/concluir-diagnostico.controller.js'
import { AprovarOrcamentoController } from './controllers/orcamentos/aprovar-orcamento.controller.js'
import { IniciarExecucaoController } from './controllers/ordem-servico/iniciar-execucao.controller.js'
import { FinalizarExecucaoController } from './controllers/ordem-servico/finalizar-execucao.controller.js'
import { RecusarOrcamentoController } from './controllers/orcamentos/recusar-orcamento.controller.js'
import { RenegociarOrcamentoController } from './controllers/orcamentos/renegociar-orcamento.controller.js'

// Use Cases
import { CriarMecanicoUseCase } from '@/modules/os-orcamento/application/use-cases/mecanicos/criar-mecanico.js'

import { CriarRecepcionistaUseCase } from '@/modules/os-orcamento/application/use-cases/recepcionistas/criar-recepcionista.js'

import { CriarClienteUseCase } from '@/modules/os-orcamento/application/use-cases/clientes/criar-cliente.js'
import { ListarClientesUseCase } from './application/use-cases/clientes/listar-clientes.js'
import { EditarClienteUseCase } from './application/use-cases/clientes/editar-cliente.js'
import { DeletarClienteUseCase } from './application/use-cases/clientes/deletar-cliente.js'

import { CriarVeiculoUseCase } from '@/modules/os-orcamento/application/use-cases/veiculos/criar-veiculo.js'
import { DeletarVeiculoUseCase } from '@/modules/os-orcamento/application/use-cases/veiculos/deletar-veiculo.js'
import { ListarVeiculosUseCase } from './application/use-cases/veiculos/listar-veiculos.js'
import { EditarVeiculoUseCase } from './application/use-cases/veiculos/editar-veiculo.js'

import { ListarServicosUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/listar-servicos.js'
import { CriarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/criar-servico.js'
import { DesativarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/desativar-servico.js'
import { ReativarServicoUseCase } from '@/modules/os-orcamento/application/use-cases/servicos/reativar-servico.js'
import { EditarServicoUseCase } from './application/use-cases/servicos/editar-servico.js'

import { CriarOrdemServicoUseCase } from './application/use-cases/ordens-servicos/criar-ordem-servico.js'
import { ObterFilaTrabalhoUseCase } from './application/use-cases/ordens-servicos/obter-fila-trabalho.js'
import { IniciarDiagnosticoUseCase } from './application/use-cases/ordens-servicos/iniciar-diagnostico.js'
import { ConcluirDiagnosticoUseCase } from './application/use-cases/ordens-servicos/concluir-diagnostico.js'
import { EncerrarOrdemServicoUseCase } from './application/use-cases/ordens-servicos/encerrar-os-por-rejeicao.js'
import { CalcularTempoMediaExecucaoServicosUseCase } from './application/use-cases/ordens-servicos/calcular-tempo-media-execucao.js'

import { GerarOrcamentoUseCase } from './application/use-cases/orcamento/gerar-orcamento.js'
import { AprovarOrcamentoUseCase } from './application/use-cases/orcamento/aprovar-orcamento.js'
import { IniciarExecucaoUseCase } from './application/use-cases/ordens-servicos/iniciar-execucao.js'
import { FinalizarExecucaoUseCase } from './application/use-cases/ordens-servicos/finalizar-execucao.js'
import { RecusarOrcamentoUseCase } from './application/use-cases/orcamento/recusar-orcamento.js'
import { RenegociarOrcamentoUseCase } from './application/use-cases/orcamento/renegociar-orcamento.js'

import { ReservarProdutosEstoqueUseCase } from '../estoque/application/use-cases/reservar-produtos-estoque.js'
import { EncerrarOrdemServicoFaturaPagaUseCase } from './application/use-cases/ordens-servicos/encerrar-os-fatura-paga.js'

// Repositories (Domain Contracts)
import { MecanicoRepository } from '@/modules/os-orcamento/domain/repositories/mecanicos-repository.js'
import { ClienteRepository } from '@/modules/os-orcamento/domain/repositories/clientes-repository.js'
import { VeiculoRepository } from '@/modules/os-orcamento/domain/repositories/veiculos-repository.js'
import { ServicoRepository } from '@/modules/os-orcamento/domain/repositories/servicos-repository.js'
import { ProdutoRepository } from '../estoque/domain/repositories/produtos-repository.js'
import { OrdemServicoRepository } from './domain/repositories/ordem-servico-repository.js'
import { UsuariosRepository } from '../autenticacao/domain/repositories/usuarios-repository.js'
import { RecepcionistaRepository } from './domain/repositories/recepcionista-repository.js'
import { OrcamentoRepository } from './domain/repositories/orcamento-repository.js'


// Prisma Repositories (Infra Implementations)
import { PrismaMecanicoRepository } from '@/infra/database/prisma/repositories/prisma-mecanico.repository.js'
import { PrismaClienteRepository } from '@/infra/database/prisma/repositories/prisma-cliente.repository.js'
import { PrismaVeiculoRepository } from '@/infra/database/prisma/repositories/prisma-veiculo.repository.js'
import { PrismaServicoRepository } from '@/infra/database/prisma/repositories/prisma-servico.repository.js'
import { PrismaProdutoRepository } from '@/infra/database/prisma/repositories/prisma-produto.repository.js'
import { PrismaOrdemServicoRepository } from '@/infra/database/prisma/repositories/prisma-ordem-servico.repository.js'
import { PrismaOrcamentoRepository } from '@/infra/database/prisma/repositories/prisma-orcamento.repository.js'
import { PrismaUsuarioRepository } from '@/infra/database/prisma/repositories/prisma-usuario.repository.js'
import { PrismaRecepcionistaRepository } from '@/infra/database/prisma/repositories/prisma-recepcionista.repository.js'

//Subscribers
import { OnDiagnosticoConcluido } from './application/subscribers/on-diagnostico-concluido.js'
import { OnClienteAprovouOrcamento } from './application/subscribers/on-orcamento-aprovado.js'
import { OnExecucaoAutorizada } from './application/subscribers/on-os-execucao-autorizada.js'
import { OnProdutosReservados } from './application/subscribers/on-produtos-reservados.js'
import { OnFaturaPagaEncerrarOrdemServico } from './application/subscribers/on-fatura-paga-encerrar-os.js'
import { OnOrcamentoRenegociadoRecusadoEncerrarOS } from './application/subscribers/on-orcamento-renegociado-recusado-encerrar-os.js'

import { FaturamentoModule } from '../faturamento/faturamento.module.js'
import { RenegociarOrcamentoService } from './domain/services/renegociar-orcamento.service.js'
import { ConcluirDiagnosticoService } from './domain/services/concluir-diagnostico.service.js'

import { ClienteOrcamentoGateway } from './application/gateways/cliente-orcamento-gateway.js'
import { DbClienteOrcamentoGateway } from '@/infra/gateways/db-cliente-orcamento-gateway.js'


@Module({
  imports: [
    forwardRef(() => FaturamentoModule), // ➔ Envolva com forwardRef,
  ],
  controllers: [
    CriarMecanicoController,
    CriarRecepcionistaController,
    CriarClienteController,
    ListarClientesController,
    EditarClienteController,
    DeletarClienteController,
    CriarVeiculoController,
    DeletarVeiculoController,
    ListarVeiculosController,
    EditarVeiculoController,
    ListarServicosController,
    CriarServicoController,
    DesativarServicoController,
    ReativarServicoController,
    EditarServicoController,
    CriarOrdemServicoController,
    ObterFilaTrabalhoController,
    IniciarDiagnosticoController,
    ConcluirDiagnosticoController,
    AprovarOrcamentoController,
    IniciarExecucaoController,
    FinalizarExecucaoController,
    RecusarOrcamentoController,
    RenegociarOrcamentoController,
    CalcularTempoMedioExecucaoServicosController,
  ],
  providers: [
    // Database Service
    PrismaService,

    // Use Cases
    CriarMecanicoUseCase,
    CriarRecepcionistaUseCase,
    CriarClienteUseCase,
    ListarClientesUseCase,
    EditarClienteUseCase,
    DeletarClienteUseCase,
    CriarVeiculoUseCase,
    DeletarVeiculoUseCase,
    ListarVeiculosUseCase,
    EditarVeiculoUseCase,
    ListarServicosUseCase,
    CriarServicoUseCase,
    DesativarServicoUseCase,
    ReativarServicoUseCase,
    EditarServicoUseCase,
    CriarOrdemServicoUseCase,
    ObterFilaTrabalhoUseCase,
    IniciarDiagnosticoUseCase,
    ConcluirDiagnosticoUseCase,
    ConcluirDiagnosticoService,
    GerarOrcamentoUseCase,
    AprovarOrcamentoUseCase,
    ReservarProdutosEstoqueUseCase,
    IniciarExecucaoUseCase,
    FinalizarExecucaoUseCase,
    EncerrarOrdemServicoFaturaPagaUseCase,
    EncerrarOrdemServicoUseCase,
    RecusarOrcamentoUseCase,
    RenegociarOrcamentoUseCase,
    RenegociarOrcamentoService,
    CalcularTempoMediaExecucaoServicosUseCase,

    //Subscribers
    OnDiagnosticoConcluido,
    OnClienteAprovouOrcamento,
    OnExecucaoAutorizada,
    OnProdutosReservados,
    OnFaturaPagaEncerrarOrdemServico,
    OnOrcamentoRenegociadoRecusadoEncerrarOS,

    {
      provide: MecanicoRepository,
      useClass: PrismaMecanicoRepository,
    },
    {
      provide: RecepcionistaRepository,
      useClass: PrismaRecepcionistaRepository,
    },
    {
      provide: ClienteRepository,
      useClass: PrismaClienteRepository,
    },
    {
      provide: VeiculoRepository,
      useClass: PrismaVeiculoRepository,
    },
    {
      provide: ServicoRepository,
      useClass: PrismaServicoRepository,
    },
    {
      provide: ProdutoRepository,
      useClass: PrismaProdutoRepository,
    },
    {
      provide: OrdemServicoRepository,
      useClass: PrismaOrdemServicoRepository,
    },
    {
      provide: OrcamentoRepository,
      useClass: PrismaOrcamentoRepository
    },
    {
      provide: UsuariosRepository,
      useClass: PrismaUsuarioRepository
    },
    {
      provide: ClienteOrcamentoGateway,
      useClass: DbClienteOrcamentoGateway
    }

  ],
  exports: [
    ClienteRepository,
    OrcamentoRepository,
    OrdemServicoRepository,
    VeiculoRepository,
  ],
})
export class OsOrcamentoModule { }