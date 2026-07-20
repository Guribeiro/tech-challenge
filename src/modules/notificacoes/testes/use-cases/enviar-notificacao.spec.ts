import { InMemoryNotificacaoService } from "../services/in-memory-notificacao-service.js";
import { EnviarNotificacaoUseCase } from "../../domain/use-cases/enviar-notificacao.js";


describe('Caso de Uso: Enviar Notificacao', () => {
  let notificacaoService: InMemoryNotificacaoService
  let sut: EnviarNotificacaoUseCase

  beforeEach(() => {
    notificacaoService = new InMemoryNotificacaoService()
    sut = new EnviarNotificacaoUseCase(notificacaoService)
  })

  it('deve enviar notificacao', async () => {
    const spy = vi.spyOn(notificacaoService, 'enviar')

    const output = await sut.execute({
      destinatario: '99999999999',
      mensagem: 'Alguma mensagem'
    })

    expect(spy).toHaveBeenCalledWith({
      destinatario: '99999999999',
      mensagem: 'Alguma mensagem'
    })

    expect(output.sucesso).toBe(true)
  })


})
