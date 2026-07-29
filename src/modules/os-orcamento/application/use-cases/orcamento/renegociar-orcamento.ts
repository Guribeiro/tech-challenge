import { Orcamento } from "@/modules/os-orcamento/domain/entities/orcamento.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/ordem-servico-componente.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js"
import { OrcamentoRepository } from "@/modules/os-orcamento/domain/repositories/orcamento-repository.js"
import { ComponenteItemInput, ServicoItemInput } from "../ordens-servicos/criar-ordem-servico.js"
import { ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js"
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js"
import { Produto } from "@/modules/estoque/domain/entities/produto.js"
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js"
import { OrcamentoServico } from "@/modules/os-orcamento/domain/entities/orcamento-servico.js"
import { OrcamentoComponente } from "@/modules/os-orcamento/domain/entities/orcamento-componente.js"
import { Injectable, UnauthorizedException } from "@nestjs/common"
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { Either, left, right } from "@/core/either.js"

interface RenegociarOrcamentoInput {
  orcamentoId: string
  usuarioId: string
  servicos?: Array<ServicoItemInput & { id?: string }>
  componentes?: Array<ComponenteItemInput & { id?: string }>
  descontoPorcentagem: number
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

type RenegociarOrcamentoOutput = Either<
  Errors,
  {
    orcamento: Orcamento
  }
>

@Injectable()
export class RenegociarOrcamentoUseCase {
  constructor(
    private readonly orcamentoRepository: OrcamentoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly servicoRepository: ServicoRepository,
    private readonly usuarioRepository: UsuariosRepository,
  ) { }

  public async execute({
    usuarioId,
    orcamentoId,
    componentes,
    servicos,
    descontoPorcentagem
  }: RenegociarOrcamentoInput): Promise<RenegociarOrcamentoOutput> {

    const usuario = await this.usuarioRepository.findById(usuarioId)

    if (!usuario) {
      return left(new AcessoNegadoError())
    }

    const isAdminOrReception = ['ADMIN', 'RECEPCAO'].includes(usuario.getRole())

    if (!isAdminOrReception) {
      return left(new AcessoNegadoError())
    }

    const orcamento = await this.orcamentoRepository.findById(orcamentoId)

    if (!orcamento) {
      return left(new RecursoNaoEncontradoError('Orçamento'))
    }

    const servicosFinais: OrcamentoServico[] = []

    if (servicos && servicos.length > 0) {
      const servicosExistentesMap = new Map(
        orcamento.getServicos().getItems().map((s) => [s.getId().toValue(), s])
      )

      const novosServicosInput = servicos.filter((s) => !s.id)
      const servicoIdsNovos = [...new Set(novosServicosInput.map((s) => s.servicoId))]

      let servicosCatalogoMap = new Map<string, Servico>()
      if (servicoIdsNovos.length > 0) {
        const servicosExistentes = await this.servicoRepository.findManyByIds(servicoIdsNovos)
        servicosCatalogoMap = new Map(servicosExistentes.map((s) => [s.getId().toValue(), s]))
      }

      for (const item of servicos) {
        const servicoExistente = item.id ? servicosExistentesMap.get(item.id) : null

        if (servicoExistente) {
          servicosFinais.push(servicoExistente)
        } else {
          const servicoDoCatalogo = servicosCatalogoMap.get(item.servicoId)

          if (!servicoDoCatalogo) {
            return left(new RecursoNaoEncontradoError('Serviço'))
          }

          servicosFinais.push(
            OrcamentoServico.criar({
              orcamentoId: orcamento.getId(),
              servicoId: servicoDoCatalogo.getId(),
              precoUnitario: servicoDoCatalogo.getValorReferencia(),
              categoria: servicoDoCatalogo.getCategoria(),
              nome: servicoDoCatalogo.getNome(),
            }),
          )
        }
      }
    }

    const componentesFinais: OrcamentoComponente[] = []

    if (componentes && componentes.length > 0) {
      const componentesExistentesMap = new Map(
        orcamento.getComponentes().getItems().map((c) => [c.getId().toValue(), c])
      )

      const novosItensInput = componentes.filter((c) => !c.id)
      const produtoIdsNovos = [...new Set(novosItensInput.map((c) => c.produtoId))]

      let produtosCatalogoMap = new Map<string, Produto>()
      if (produtoIdsNovos.length > 0) {
        const produtosExistentes = await this.produtoRepository.findManyByIds(produtoIdsNovos)
        produtosCatalogoMap = new Map(produtosExistentes.map((p) => [p.getId().toValue(), p]))
      }

      for (const item of componentes) {
        const componenteExistente = item.id ? componentesExistentesMap.get(item.id) : null

        if (componenteExistente) {
          componenteExistente.setQuantidade(item.quantidade)
          componentesFinais.push(componenteExistente)
        } else {
          const produtoDoCatalogo = produtosCatalogoMap.get(item.produtoId)

          if (!produtoDoCatalogo) {
            return left(new RecursoNaoEncontradoError('Produto'))
          }

          componentesFinais.push(
            OrcamentoComponente.criar({
              orcamentoId: orcamento.getId(),
              produtoId: produtoDoCatalogo.getId(),
              nome: produtoDoCatalogo.getNome(),
              tipo: produtoDoCatalogo.getTipo(),
              marca: produtoDoCatalogo.getMarca(),
              descricao: produtoDoCatalogo.getNome(),
              codigoSKU: produtoDoCatalogo.getCodigoSKU(),
              codigoFabricante: produtoDoCatalogo.getCodigoFabricante(),
              unidadeMedida: produtoDoCatalogo.getUnidadeMedida(),
              quantidade: item.quantidade,
              precoUnitario: produtoDoCatalogo.getPrecoUnitario(),
              precoCusto: produtoDoCatalogo.getPrecoCusto(),
            }),
          )
        }
      }
    }

    orcamento.renegociar(servicosFinais, componentesFinais, descontoPorcentagem)

    await this.orcamentoRepository.save(orcamento)

    return right({
      orcamento
    })
  }
}