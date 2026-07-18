import { AutenticarUseCase } from "@/modules/autenticacao/application/use-cases/autenticar.js";
import { Encrypter } from "@/modules/autenticacao/domain/cryptography/encrypter.js";
import { HashGenerator } from "@/modules/autenticacao/domain/cryptography/hash-generator.js";
import { Usuario } from "@/modules/autenticacao/domain/entities/usuario.js";
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js";
import { Email } from "@/shared/domain/value-objects/email.js";
import { FakeEncrypter } from "../cryptography/fake-encrypter.js";
import { FakeHasher } from "../cryptography/fake-hasher.js";
import { InMemoryUsuariosRepository } from "../repositories/in-memory-users-repository.js";

describe('Caso de Uso: Autenticar', () => {
  let sut: AutenticarUseCase
  let usuariosRepository: UsuariosRepository
  let hashGenerator: HashGenerator
  let encrypter: Encrypter

  beforeEach(() => {
    usuariosRepository = new InMemoryUsuariosRepository()
    hashGenerator = new FakeHasher()
    encrypter = new FakeEncrypter()

    sut = new AutenticarUseCase(
      usuariosRepository,
      hashGenerator,
      encrypter
    )
  })

  it('Deve ser possivel autenticar', async () => {
    const senhaHash = await hashGenerator.generateHash('senha')

    const usuario = new Usuario({
      email: Email.criar('usuario@email.com'),
      role: 'ADMIN',
      senhaHash
    })

    await usuariosRepository.create(usuario)

    const { accessToken } = await sut.execute({
      email: usuario.getEmail().getValor(),
      senha: 'senha'
    })

    expect(accessToken).toBeTruthy()
  })

  it('Não deve ser possivel autenticar com um email invalido', async () => {
    const senhaHash = await hashGenerator.generateHash('senha')

    const usuario = new Usuario({
      email: Email.criar('usuario@email.com'),
      role: 'ADMIN',
      senhaHash
    })

    await usuariosRepository.create(usuario)

    expect(sut.execute({
      email: 'invalid@email.com',
      senha: 'senha'
    })).rejects.toBeInstanceOf(Error)
  })

  it('Não deve ser possivel autenticar com uma senha invalida', async () => {
    const senhaHash = await hashGenerator.generateHash('senha')

    const usuario = new Usuario({
      email: Email.criar('usuario@email.com'),
      role: 'ADMIN',
      senhaHash
    })

    await usuariosRepository.create(usuario)

    expect(sut.execute({
      email: usuario.getEmail().getValor(),
      senha: 'invalid-password'
    })).rejects.toBeInstanceOf(Error)
  })
})