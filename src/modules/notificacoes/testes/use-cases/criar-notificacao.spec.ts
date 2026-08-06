import { CriarNotificacaoUseCase } from '../../application/use-cases/criar-notificacao.js'
import { InMemoryNotificacaoRepository } from '@/modules/notificacoes/testes/repositories/in-memory-notificacao-repository.js'

describe('Caso de Uso: Criar Notificação', () => {
  let notificacaoRepository: InMemoryNotificacaoRepository
  let sut: CriarNotificacaoUseCase

  beforeEach(() => {
    vi.clearAllMocks()

    notificacaoRepository = new InMemoryNotificacaoRepository()
    sut = new CriarNotificacaoUseCase(notificacaoRepository)
  })

  it('deve criar e persistir uma notificação com sucesso', async () => {
    const input = {
      destinatarioId: 'usr-uuid-123',
      titulo: 'Notificação de Teste',
      conteudo: 'Este é um conteúdo de teste da notificação.',
      template: 'alerta-sistema',
      contexto: {
        origem: 'modulo-os',
      },
    }

    const output = await sut.execute(input)

    // Valida o retorno do Use Case
    expect(output.notificacao).toBeDefined()
    expect(output.notificacao.getDestinatarioId().toValue()).toBe('usr-uuid-123')
    expect(output.notificacao.getTitulo()).toBe('Notificação de Teste')
    expect(output.notificacao.getConteudo()).toBe(
      'Este é um conteúdo de teste da notificação.',
    )
    expect(output.notificacao.getTemplate()).toBe('alerta-sistema')
    expect(output.notificacao.getContexto()).toEqual({ origem: 'modulo-os' })

    // Valida a persistência no repositório em memória
    expect(notificacaoRepository.notificacoes).toHaveLength(1)
    expect(notificacaoRepository.notificacoes[0].getId().toValue()).toEqual(output.notificacao.getId().toValue())
  })
})