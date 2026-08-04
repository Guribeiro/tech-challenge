import { Module } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { ProdutoRepository } from './domain/repositories/produtos-repository.js'

import { CriarProdutoUseCase } from './application/use-cases/criar-produto.js'
import { ListarProdutosUseCase } from './application/use-cases/listar-produtos.js'
import { DesativarProdutoUseCase } from './application/use-cases/desativar-produto.js'
import { ReativarProdutoUseCase } from './application/use-cases/reativar-produto.js'


import { CriarProdutoController } from './controllers/produto/criar-produto.controller.js'
import { ListarProdutosController } from './controllers/produto/listar-produtos.controller.js'
import { DesativarProdutoController } from './controllers/produto/desativar-produto.controller.js'
import { ReativarProdutoController } from './controllers/produto/reativar-produto.controller.js'

import { PrismaProdutoRepository } from '@/infra/database/prisma/repositories/prisma-produto.repository.js'
import { OnOrdemServicoFinalizadaDeduzirEstoque } from './application/subscribers/on-os-finalizada-deduzir-estoque.js'
import { DeduzirEstoqueUseCase } from './application/use-cases/deduzir-estoque.js'

@Module({
  controllers: [
    CriarProdutoController,
    ListarProdutosController,
    DesativarProdutoController,
    ReativarProdutoController
  ],
  providers: [
    PrismaService,
    CriarProdutoUseCase,
    ListarProdutosUseCase,
    DesativarProdutoUseCase,
    ReativarProdutoUseCase,
    DeduzirEstoqueUseCase,

    //Subscriber
    OnOrdemServicoFinalizadaDeduzirEstoque,
    {
      provide: ProdutoRepository,
      useClass: PrismaProdutoRepository
    }
  ]
})
export class EstoqueModule { }