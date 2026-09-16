import { describe, beforeEach, it, expect } from 'vitest'
import { ListarOSAtivasUseCase } from '@/modules/os-orcamento/application/use-cases/ordens-servicos/listar-os-ativas.js'
import { InMemoryOrdemServicoRepository } from '../../repositories/in-memory-ordem-servico-repository.js'
import { makeOrdemServico } from '../../factories/make-ordem-servico.js'

let inMemoryOrdemServicoRepository: InMemoryOrdemServicoRepository
let sut: ListarOSAtivasUseCase

describe('Listar Ordens de Serviço Ativas Use Case', () => {
  beforeEach(() => {
    inMemoryOrdemServicoRepository = new InMemoryOrdemServicoRepository()
    sut = new ListarOSAtivasUseCase(inMemoryOrdemServicoRepository)
  })

  it('deve listar apenas as OSs ativas ordenando por prioridade de status e por antiguidade', async () => {
    // Arrange: Cria OSs em diferentes status e datas de criação
    const osRecebida = makeOrdemServico({
      status: 'RECEBIDA',
      criadoEm: new Date('2026-01-01'),
    })
    const osEmExecucaoRecente = makeOrdemServico({
      status: 'EM_EXECUCAO',
      criadoEm: new Date('2026-01-05'),
    })
    const osEmExecucaoAntiga = makeOrdemServico({
      status: 'EM_EXECUCAO',
      criadoEm: new Date('2026-01-02'),
    })
    const osEntregue = makeOrdemServico({
      status: 'ENTREGUE',
      criadoEm: new Date('2026-01-01'),
    })

    await inMemoryOrdemServicoRepository.create(osRecebida)
    await inMemoryOrdemServicoRepository.create(osEmExecucaoRecente)
    await inMemoryOrdemServicoRepository.create(osEmExecucaoAntiga)
    await inMemoryOrdemServicoRepository.create(osEntregue)

    // Act
    const result = await sut.execute()

    console.log(result)

    // Assert
    if (result.isRight()) {
      // Exclusão lógica: a OS ENTREGUE deve ser desconsiderada
      expect(result.value.ordensServicos).toHaveLength(3)
      expect(result.value.total).toBe(3)

      // Garantia da prioridade de status e antiguidade como desempate
      expect(result.value.ordensServicos[0].getId().toValue()).toBe(
        osEmExecucaoAntiga.getId().toValue(),
      )
      expect(result.value.ordensServicos[1].getId().toValue()).toBe(
        osEmExecucaoRecente.getId().toValue(),
      )
      expect(result.value.ordensServicos[2].getId().toValue()).toBe(
        osRecebida.getId().toValue(),
      )
    }
  })

  it('deve excluir logicamente as OSs finalizadas e encerradas da listagem', async () => {
    // Arrange
    const osAtiva = makeOrdemServico({ status: 'RECEBIDA' })
    const osEntregue = makeOrdemServico({ status: 'ENTREGUE' })
    const osEncerrada = makeOrdemServico({ status: 'ENCERRADA' })
    const osEncerradaRejeicao = makeOrdemServico({ status: 'ENCERRADA_REJEICAO' })

    await inMemoryOrdemServicoRepository.create(osAtiva)
    await inMemoryOrdemServicoRepository.create(osEntregue)
    await inMemoryOrdemServicoRepository.create(osEncerrada)
    await inMemoryOrdemServicoRepository.create(osEncerradaRejeicao)

    // Act
    const result = await sut.execute()

    // Assert
    if (result.isRight()) {
      expect(result.value.ordensServicos).toHaveLength(1)
      expect(result.value.ordensServicos[0].getId().toValue()).toBe(
        osAtiva.getId().toValue(),
      )
      expect(result.value.total).toBe(1)
    }
  })

  it('deve aplicar a paginação corretamente mantendo a ordenação', async () => {
    // Arrange: Cria 3 OSs com status RECEBIDA
    const os1 = makeOrdemServico({
      status: 'RECEBIDA',
      criadoEm: new Date('2026-01-01'),
    })
    const os2 = makeOrdemServico({
      status: 'RECEBIDA',
      criadoEm: new Date('2026-01-02'),
    })
    const os3 = makeOrdemServico({
      status: 'RECEBIDA',
      criadoEm: new Date('2026-01-03'),
    })

    await inMemoryOrdemServicoRepository.create(os1)
    await inMemoryOrdemServicoRepository.create(os2)
    await inMemoryOrdemServicoRepository.create(os3)

    // Act: Solicita a página 2 com limite de 2 itens
    const result = await sut.execute({
      pagina: 2,
      limite: 2,
    })

    // Assert
    if (result.isRight()) {
      expect(result.value.ordensServicos).toHaveLength(1)
      expect(result.value.ordensServicos[0].getId().toValue()).toBe(
        os3.getId().toValue(),
      )
      expect(result.value.total).toBe(3)
      expect(result.value.pagina).toBe(2)
      expect(result.value.limite).toBe(2)
    }
  })

  it('deve retornar uma lista vazia quando existirem apenas OSs finalizadas ou entregues', async () => {
    // Arrange
    const osEntregue = makeOrdemServico({ status: 'ENTREGUE' })
    await inMemoryOrdemServicoRepository.create(osEntregue)

    // Act
    const result = await sut.execute()

    // Assert
    if (result.isRight()) {
      expect(result.value.ordensServicos).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })
})