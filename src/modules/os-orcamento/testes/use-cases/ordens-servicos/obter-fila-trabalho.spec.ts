import { describe, beforeEach, it, expect } from 'vitest'
import { ObterFilaTrabalhoUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/obter-fila-trabalho.js'
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordem-servico-repository.js'
import { makeOrdemServico } from '../../factories/make-ordem-servico.js'

let inMemoryOrdemServicoRepository: InMemoryOrdemServicoRepository
let sut: ObterFilaTrabalhoUseCase

describe('Obter Fila de Trabalho Use Case', () => {
  beforeEach(() => {
    inMemoryOrdemServicoRepository = new InMemoryOrdemServicoRepository()
    sut = new ObterFilaTrabalhoUseCase(inMemoryOrdemServicoRepository)
  })

  it('deve listar a fila de trabalho com valores padrão de paginação e status RECEBIDA', async () => {
    // Arrange: Prepara o cenário com ordens de serviço
    const osRecebida = makeOrdemServico({ status: 'RECEBIDA' })
    const osEmDiagnostico = makeOrdemServico({ status: 'EM_DIAGNOSTICO' })

    await inMemoryOrdemServicoRepository.create(osRecebida)
    await inMemoryOrdemServicoRepository.create(osEmDiagnostico)

    // Act
    const result = await sut.execute({})

    if (result.isRight()) {
      expect(result.value.ordensServicos).toHaveLength(1)
      expect(result.value.ordensServicos[0].getId().toValue()).toBe(osRecebida.getId().toValue())
      expect(result.value.total).toBe(1)
      expect(result.value.pagina).toBe(1)
      expect(result.value.limite).toBe(10)
    }
  })

  it('deve filtrar a fila de trabalho por um status específico', async () => {
    // Arrange: Utilizando um status válido do novo enum (AUTORIZADA)
    const osAutorizada1 = makeOrdemServico({ status: 'AUTORIZADA' })
    const osAutorizada2 = makeOrdemServico({ status: 'AUTORIZADA' })
    const osRecebida = makeOrdemServico({ status: 'RECEBIDA' })

    await inMemoryOrdemServicoRepository.create(osAutorizada1)
    await inMemoryOrdemServicoRepository.create(osAutorizada2)
    await inMemoryOrdemServicoRepository.create(osRecebida)

    // Act
    const result = await sut.execute({
      status: 'AUTORIZADA',
    })

    // Assert
    if (result.isRight()) {
      expect(result.value.ordensServicos).toHaveLength(2)
      expect(result.value.total).toBe(2)
    }
  })

  it('deve aplicar a paginação corretamente', async () => {
    // Arrange: Cria 3 ordens com status RECEBIDA
    for (let i = 0; i < 3; i++) {
      await inMemoryOrdemServicoRepository.create(
        makeOrdemServico({ status: 'RECEBIDA' }),
      )
    }

    // Act: Solicita a página 2 com limite de 2 itens por página
    const result = await sut.execute({
      pagina: 2,
      limite: 2,
      status: 'RECEBIDA',
    })

    if (result.isRight()) {
      expect(result.value.ordensServicos).toHaveLength(1) // Resta apenas 1 item na pág 2
      expect(result.value.total).toBe(3)
      expect(result.value.pagina).toBe(2)
      expect(result.value.limite).toBe(2)
    }

  })

  it('deve retornar uma lista vazia quando nenhuma ordem de serviço corresponder aos filtros', async () => {
    // Act: Utilizando o status 'FINALIZADA' do novo enum
    const result = await sut.execute({
      status: 'FINALIZADA',
    })

    // Assert
    if (result.isRight()) {
      expect(result.value.ordensServicos).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })
})