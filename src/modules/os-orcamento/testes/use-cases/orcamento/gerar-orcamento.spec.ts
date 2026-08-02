import { beforeEach, describe, expect, it } from 'vitest'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { GerarOrcamentoUseCase } from '@/modules/os-orcamento/application/use-cases/orcamento/gerar-orcamento.js'
import { InMemoryOrcamentoRepository } from '../../repositories/in-memory-orcamento-repository.js'
import { OrdemServicoServico } from '@/modules/os-orcamento/domain/entities/ordem-servico-servico.js'
import { OrdemServicoComponente } from '@/modules/os-orcamento/domain/entities/ordem-servico-componente.js'

describe('GerarOrcamentoUseCase', () => {
  let inMemoryOrcamentoRepository: InMemoryOrcamentoRepository
  let sut: GerarOrcamentoUseCase

  beforeEach(() => {
    inMemoryOrcamentoRepository = new InMemoryOrcamentoRepository()
    sut = new GerarOrcamentoUseCase(inMemoryOrcamentoRepository)
  })

  it('deve ser possível gerar um orçamento a partir dos dados da ordem de serviço', async () => {
    const ordemServicoId = new UniqueEntityID().toValue()
    const clienteId = new UniqueEntityID().toValue()

    const servico = OrdemServicoServico.criar({
      ordemServicoId: new UniqueEntityID(ordemServicoId),
      servicoId: new UniqueEntityID(),
      nome: 'Troca de Óleo',
      descricao: 'Troca de óleo do motor e filtro',
      categoria: 'MANUTENCAO_PREVENTIVA',
      precoUnitario: 150,
    })

    const componente = OrdemServicoComponente.criar({
      ordemServicoId: new UniqueEntityID(ordemServicoId),
      produtoId: new UniqueEntityID(),
      nome: 'Filtro de Óleo',
      marca: 'Bosch',
      precoCusto: 20,
      tipo: 'PECA',
      codigoFabricante: 'FAB-123',
      codigoSKU: 'SKU-123',
      descricao: 'Filtro de óleo para motor 1.0',
      unidadeMedida: 'UN',
      quantidade: 1,
      precoUnitario: 35,
    })

    const result = await sut.execute({
      ordemServicoId,
      clienteId,
      servicos: [servico],
      componentes: [componente],
    })

    expect(result.orcamento).toBeDefined()
    expect(result.orcamento.getId()).toBeDefined()
    expect(result.orcamento.getOrdemServicoId().toValue()).toBe(ordemServicoId)
    expect(result.orcamento.getClienteId().toValue()).toBe(clienteId)

    // Valida serviços mapeados
    const servicosOrcamento = result.orcamento.getServicos().getItems()
    expect(servicosOrcamento).toHaveLength(1)
    expect(servicosOrcamento[0].getNome()).toBe('Troca de Óleo')
    expect(servicosOrcamento[0].getPrecoUnitario()).toBe(150)

    // Valida componentes mapeados
    const componentesOrcamento = result.orcamento.getComponentes().getItems()
    expect(componentesOrcamento).toHaveLength(1)
    expect(componentesOrcamento[0].getNome()).toBe('Filtro de Óleo')
    expect(componentesOrcamento[0].getQuantidade()).toBe(1)
    expect(componentesOrcamento[0].getPrecoUnitario()).toBe(35)

    // Persistência no Repositório
    expect(inMemoryOrcamentoRepository.items).toHaveLength(1)
    expect(inMemoryOrcamentoRepository.items[0].getId()).toEqual(result.orcamento.getId())
  })

  it('deve gerar um orçamento sem serviços e sem componentes se as listas estiverem vazias', async () => {
    const ordemServicoId = new UniqueEntityID().toValue()
    const clienteId = new UniqueEntityID().toValue()

    const result = await sut.execute({
      ordemServicoId,
      clienteId,
      servicos: [],
      componentes: [],
    })

    expect(result.orcamento).toBeDefined()
    expect(result.orcamento.getServicos().getItems()).toHaveLength(0)
    expect(result.orcamento.getComponentes().getItems()).toHaveLength(0)
    expect(inMemoryOrcamentoRepository.items).toHaveLength(1)
  })

  it('deve alterar o status do orçamento para ENVIADO ao ser criado', async () => {
    const result = await sut.execute({
      ordemServicoId: new UniqueEntityID().toValue(),
      clienteId: new UniqueEntityID().toValue(),
      servicos: [],
      componentes: [],
    })

    expect(result.orcamento.getStatus()).toBe('ENVIADO')
  })
})