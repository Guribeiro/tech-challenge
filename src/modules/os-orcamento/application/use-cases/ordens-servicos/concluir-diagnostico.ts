import { Role } from "@/modules/autenticacao/domain/entities/usuario.js"
import { OrdemServicoComponente } from "@/modules/os-orcamento/domain/entities/ordem-servico-componente.js"
import { OrdemServicoServico } from "@/modules/os-orcamento/domain/entities/ordem-servico-servico.js"
import { OrdemServicoRepository } from "@/modules/os-orcamento/domain/repositories/ordem-servico-repository.js"
import { Injectable, UnauthorizedException } from "@nestjs/common"
import { ComponenteItemInput, ServicoItemInput } from "./criar-ordem-servico.js"
import { ProdutoRepository } from "@/modules/estoque/domain/repositories/produtos-repository.js"
import { ServicoRepository } from "@/modules/os-orcamento/domain/repositories/servicos-repository.js"
import { Servico } from "@/modules/os-orcamento/domain/entities/servico.js"
import { Produto } from "@/modules/estoque/domain/entities/produto.js"

interface ConcluirDiagnosticoInput {
  ordemServicoId: string
  usuarioId: string
  usuarioRole: Role
  servicos?: Array<ServicoItemInput & { id?: string }>
  componentes?: Array<ComponenteItemInput & { id?: string }>
}

@Injectable()
export class ConcluirDiagnosticoUseCase {
  constructor(
    private readonly ordemServicoRepository: OrdemServicoRepository,
    private readonly produtoRepository: ProdutoRepository,
    private readonly servicoRepository: ServicoRepository,
  ) { }

  public async execute(input: ConcluirDiagnosticoInput): Promise<void> {
    const ordemServico = await this.ordemServicoRepository.findById(input.ordemServicoId)
    if (!ordemServico) {
      throw new Error(`Ordem de Serviço ${input.ordemServicoId} não encontrada.`)
    }

    const isOwner = ordemServico.getMecanicoId()?.toValue() === input.usuarioId

    const isAdminOrReception = ['ADMIN', 'RECEPCAO'].includes(input.usuarioRole)

    if (!isOwner && !isAdminOrReception) {
      throw new UnauthorizedException(
        'Apenas o mecânico responsável que iniciou o diagnóstico (ou um gestor) pode concluí-lo.'
      )
    }

    const ordemServicoId = ordemServico.getId()

    // 3. Processamento de Serviços
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
            throw new Error(`Serviço com ID ${item.servicoId} não encontrado no catálogo.`)
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
            throw new Error(`Produto com ID ${item.produtoId} não encontrado no catálogo.`)
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
  }
}