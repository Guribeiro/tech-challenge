import { PrismaTermoLiberacaoRepository } from "@/infra/database/prisma/repositories/prisma-termo-liberacao-repository.js";
import { Module } from "@nestjs/common";
import { TermoLiberacaoRepository } from "./domain/repositories/termoRepository.js";
import { PrismaService } from "@/infra/database/prisma/prisma.service.js";
import { OsOrcamentoModule } from "../os-orcamento/os-orcamento.module.js";
import { EmitirTermoRejeicaoUseCase } from "./application/use-cases/emitir-termo-liberacao-rejeicao.js";
import { OnOrdemServicoEncerrada } from "./application/subscribers/on-os-encerrada.js";
import { OnOrdemServicoEncerradaPorRejeicao } from "./application/subscribers/on-os-encerrada-por-rejeicao.js";
import { EmitirTermoLiberacaoUseCase } from "./application/use-cases/emitir-termo-liberacao.js";

@Module({
  imports: [OsOrcamentoModule],
  providers: [
    PrismaService,

    EmitirTermoRejeicaoUseCase,
    EmitirTermoLiberacaoUseCase,

    OnOrdemServicoEncerrada,
    OnOrdemServicoEncerradaPorRejeicao,
    {
      provide: TermoLiberacaoRepository,
      useClass: PrismaTermoLiberacaoRepository,
    },
  ]
})
export class LiberacaoModule { }