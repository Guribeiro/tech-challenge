import { Either, left, right } from "@/core/either.js"
import { AcessoNegadoError, RecursoNaoEncontradoError } from "@/core/errors/index.js"
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js"
import { Produto } from "@/modules/estoque/domain/entities/produto.js"
import { ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/ordem-servico-componente.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js"
import { OrdemServico } from "@/modules/os-orcamento/domain/entities/ordem-servico.js"
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js"
import { Injectable } from "@nestjs/common"
import { ComponenteItemInput, ServicoItemInput } from "./criar-ordem-servico.js"

interface ConcluirDiagnosticoInput {
  ordemServicoId: string
  usuarioId: string
  servicos?: Array<ServicoItemInput & { id?: string }>
  componentes?: Array<ComponenteItemInput & { id?: string }>
}

type Errors = RecursoNaoEncontradoError | AcessoNegadoError

type ConcluirDiagnosticoOutput = Either<
  Errors,
  {
    ordemServico: OrdemServico
  }
>

@Injectable()
export class ConcluirDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly servicoRepository: ServicoRepository,
    private readonly usuarioRepository: UsuariosRepository,
  ) { }

  public async execute(input: ConcluirDiagnosticoInput): Promise<ConcluirDiagnosticoOutput> {

    const usuario = await this.usuarioRepository.findById(input.usuarioId)

    if (!usuario) {
      return left(new AcessoNegadoError())
    }

    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)

    if (!ordemServico) {
      return left(new RecursoNaoEncontradoError('Ordem de Serviço'))
    }

    const isOwner = ordemServico.getMecanicoId()?.toValue() === input.usuarioId

    const isAdminOrReception = ['ADMIN', 'RECEPCAO'].includes(usuario.getRole())

    if (!isOwner && !isAdminOrReception) {
      return left(new AcessoNegadoError('Apenas o mecânico responsável que iniciou o diagnóstico (ou um gestor) pode concluí-lo.'))
    }

    const ordemServicoId = ordemServico.getId()

    const servicosFinais: OrdemServicoServico[] = []

    if (input.servicos && input.servicos.length > 0) {
      // Map dos serviços EXISTENTES na OS (chave = ID da Entidade OrdemServicoServico)
      const servicosExistentesMap = new Map(
        ordemServico.getServicos().getItems().map((s) => [s.getId().toValue(), s])
      )

      // Filtra itens NOVOS (sem `id` da relação) para buscar no catálogo de serviços
      const novosServicosInput = input.servicos.filter((s) => !s.id)
      const servicoIdsNovos = [...new Set(novosServicosInput.map((s) => s.servicoId))]

      let servicosCatalogoMap = new Map<string, Servico>()
      if (servicoIdsNovos.length > 0) {
        const servicosExistentes = await this.servicoRepository.findManyByIds(servicoIdsNovos)
        servicosCatalogoMap = new Map(servicosExistentes.map((s) => [s.getId().toValue(), s]))
      }

      for (const item of input.servicos) {
        // Busca no Map usando `item.id` (ID do serviço já associado à OS)
        const servicoExistente = item.id ? servicosExistentesMap.get(item.id) : null

        if (servicoExistente) {
          // ➔ SERVIÇO JÁ EXISTIA NA OS: Preserva a instância intacta
          servicosFinais.push(servicoExistente)
        } else {
          // ➔ SERVIÇO NOVO: Busca do catálogo e cria nova entidade congelando dados
          const servicoDoCatalogo = servicosCatalogoMap.get(item.servicoId)

          if (!servicoDoCatalogo) {
            return left(new RecursoNaoEncontradoError(`Serviço com ID ${item.servicoId}`))
          }

          servicosFinais.push(
            OrdemServicoServico.criar({
              ordemServicoId,
              servicoId: servicoDoCatalogo.getId(),
              precoUnitario: servicoDoCatalogo.getValorReferencia(), // Congela valor de referência
              categoria: servicoDoCatalogo.getCategoria(),
              nome: servicoDoCatalogo.getNome(),
            }),
          )
        }
      }
    }

    const componentesFinais: OrdemServicoComponente[] = []

    if (input.componentes && input.componentes.length > 0) {
      // Mapeia os componentes que JÁ EXISTEM na OS
      const componentesExistentesMap = new Map(
        ordemServico.getComponentes().getItems().map((c) => [c.getId().toValue(), c])
      )

      // Filtra IDs de produtos que precisam ser buscados no catálogo (apenas para ITENS NOVOS)
      const novosItensInput = input.componentes.filter((c) => !c.id)
      const produtoIdsNovos = [...new Set(novosItensInput.map((c) => c.produtoId))]

      let produtosCatalogoMap = new Map<string, Produto>()
      if (produtoIdsNovos.length > 0) {
        const produtosExistentes = await this.produtoRepository.findManyByIds(produtoIdsNovos)
        produtosCatalogoMap = new Map(produtosExistentes.map((p) => [p.getId().toValue(), p]))
      }

      for (const item of input.componentes) {
        const componenteExistente = item.id ? componentesExistentesMap.get(item.id) : null

        if (componenteExistente) {
          // ➔ ITEM JÁ EXISTIA NA OS: Apenas atualiza a quantidade se mudou
          componenteExistente.setQuantidade(item.quantidade)
          componentesFinais.push(componenteExistente)
        } else {
          // ➔ ITEM NOVO: Busca dados do catálogo para congelar preços/snapshot
          const produtoDoCatalogo = produtosCatalogoMap.get(item.produtoId)

          if (!produtoDoCatalogo) {
            return left(new RecursoNaoEncontradoError(`Produto com ID ${item.produtoId}`))
          }

          componentesFinais.push(
            OrdemServicoComponente.criar({
              ordemServicoId,
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
    ordemServico.concluirDiagnostico(servicosFinais, componentesFinais)

    await this.ordemServicoRepository.save(ordemServico)

    return right({
      ordemServico
    })
  }
}