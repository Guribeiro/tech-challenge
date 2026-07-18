import { HashGenerator } from "@/modules/autenticacao/domain/cryptography/hash-generator.js";
import { Usuario } from "@/modules/autenticacao/domain/entities/usuario.js";
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js";
import { Email } from "@/shared/domain/value-objects/email.js";
import { FakeEncrypter } from "../cryptography/fake-encrypter.js";
import { FakeHasher } from "../cryptography/fake-hasher.js";
import { InMemoryUsuariosRepository } from "../repositories/in-memory-users-repository.js";
import { CriarCredenciaisUseCase } from "../../application/use-cases/criar-credenciais.js";
import { OnUsuarioCriado } from "@/modules/notificacoes/application/subscribers/on-usuario-criado.js";
import { EnviarNotificacaoUseCase } from "@/modules/notificacoes/domain/use-case/enviar-notificacao.js";
import { InMemoryNotificacaoService } from "@/modules/notificacoes/testes/services/in-memory-notificacao-service.js";
import { NotificacaoService } from "@/modules/notificacoes/domain/services/notificacao-service.js";
import { Mecanico } from "@/modules/os-orcamento/domain/entities/mecanico.js";
import { makeMecanico } from "@/modules/os-orcamento/testes/factories/make-mecanico.js";
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js";
import { InMemoryMecanicosRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js";
import { OnMecanicoCriado } from "../../application/subscribers/on-mecanico-criado.js";

describe('Caso de Uso: Criar Credenciais', () => {
  let sut: CriarCredenciaisUseCase
  let usuariosRepository: InMemoryUsuariosRepository
  let hashGenerator: HashGenerator
  let enviarNotificacao: EnviarNotificacaoUseCase
  let notificacaoService: NotificacaoService

  let mecanicoRepository: MecanicoRepository

  beforeEach(() => {
    usuariosRepository = new InMemoryUsuariosRepository()
    hashGenerator = new FakeHasher()
    notificacaoService = new InMemoryNotificacaoService()

    enviarNotificacao = new EnviarNotificacaoUseCase(notificacaoService)
    mecanicoRepository = new InMemoryMecanicosRepository

    sut = new CriarCredenciaisUseCase(
      usuariosRepository,
      hashGenerator,
    )

    new OnMecanicoCriado(sut)

    new OnUsuarioCriado(enviarNotificacao)
  })

  it('Deve criar usuario de acesso para MECANICO', async () => {
    const spyNotificacao = vi.spyOn(notificacaoService, 'enviar')

    const mecanico = makeMecanico()

    await mecanicoRepository.save(mecanico)

    await vi.waitFor(() => {
      // Asserção 1: O usuário foi mapeado e criado com sucesso com o mesmo ID do mecânico?
      const usuarioCriado = usuariosRepository.items.find(
        (user) => user.getId().toValue() === mecanico.getId().toValue()
      )
      expect(usuarioCriado).toBeTruthy()

      expect(spyNotificacao).toHaveBeenCalled()
    })
  })

})