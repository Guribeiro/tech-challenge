import { HashGenerator } from "@/modules/autenticacao/domain/cryptography/hash-generator.js";
import { FakeHasher } from "../cryptography/fake-hasher.js";
import { InMemoryUsuariosRepository } from "../repositories/in-memory-users-repository.js";
import { CriarCredenciaisUseCase } from "../../application/use-cases/criar-credenciais.js";
import { OnUsuarioCriado } from "@/modules/notificacoes/application/subscribers/on-usuario-criado.js";
import { CriarNotificacaoUseCase } from "@/modules/notificacoes/application/use-cases/criar-notificacao.js";
import { makeMecanico } from "@/modules/os-orcamento/testes/factories/make-mecanico.js";
import { MecanicoRepository } from "@/modules/os-orcamento/domain/repositories/mecanicos-repository.js";
import { InMemoryMecanicosRepository } from "@/modules/os-orcamento/testes/repositories/in-memory-mecanicos-repository.js";
import { OnMecanicoCriado } from "../../application/subscribers/on-mecanico-criado.js";

describe('Caso de Uso: Criar Credenciais', () => {
  let sut: CriarCredenciaisUseCase
  let usuariosRepository: InMemoryUsuariosRepository
  let hashGenerator: HashGenerator
  let criarNotificacao: CriarNotificacaoUseCase
  let mecanicoRepository: MecanicoRepository

  beforeEach(() => {
    vi.clearAllMocks()

    usuariosRepository = new InMemoryUsuariosRepository()
    hashGenerator = new FakeHasher()

    criarNotificacao = {
      execute: vi.fn(),
    } as unknown as CriarNotificacaoUseCase

    mecanicoRepository = new InMemoryMecanicosRepository()

    sut = new CriarCredenciaisUseCase(
      usuariosRepository,
      hashGenerator,
    )

    new OnMecanicoCriado(sut)
    new OnUsuarioCriado(criarNotificacao)
  })

  it('Deve criar usuario de acesso para MECANICO', async () => {
    const mecanico = makeMecanico()

    await mecanicoRepository.save(mecanico)

    const result = await sut.execute({
      id: mecanico.getId().toValue(),
      email: mecanico.getEmail().getValor(),
      role: 'MECANICO'
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.usuario.getId().equals(mecanico.getId())).toBe(true)
      expect(result.value.usuario.getRole()).toBe('MECANICO')
    }
  })
})