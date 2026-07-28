import { AutenticarUseCase } from "@/modules/autenticacao/application/use-cases/autenticar.js";
import { Encrypter } from "@/modules/autenticacao/domain/cryptography/encrypter.js";
import { HashGenerator } from "@/modules/autenticacao/domain/cryptography/hash-generator.js";
import { Usuario } from "@/modules/autenticacao/domain/entities/usuario.js";
import { UsuariosRepository } from "@/modules/autenticacao/domain/repositories/usuarios-repository.js";
import { Email } from "@/shared/domain/value-objects/email.js";
import { FakeEncrypter } from "../cryptography/fake-encrypter.js";
import { FakeHasher } from "../cryptography/fake-hasher.js";
import { InMemoryUsuariosRepository } from "../repositories/in-memory-users-repository.js";
import { CredenciaisInvalidasError } from "@/core/errors/credenciais-invalidas-error.js";

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

    const usuario = Usuario.create({
      email: Email.criar('usuario@email.com'),
      role: 'ADMIN',
      senhaHash,
    })

    await usuariosRepository.create(usuario)

    const result = await sut.execute({
      email: usuario.getEmail().getValor(),
      senha: 'senha'
    })

    expect(result.isRight()).toBe(true)

    if (result.isRight()) {
      expect(result.value.accessToken).toEqual(expect.any(String))
      expect(result.value.usuario).toEqual({
        email: 'usuario@email.com',
        role: 'ADMIN',
      })
    }
  })

  it('Não deve ser possivel autenticar com um email invalido', async () => {
    const senhaHash = await hashGenerator.generateHash('senha')

    const usuario = Usuario.create({
      email: Email.criar('usuario@email.com'),
      role: 'ADMIN',
      senhaHash,
    })

    await usuariosRepository.create(usuario)

    const result = await sut.execute({
      email: 'invalid@email.com',
      senha: 'senha'
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CredenciaisInvalidasError)
    }
  })

  it('Não deve ser possivel autenticar com uma senha invalida', async () => {
    const senhaHash = await hashGenerator.generateHash('senha')

    const usuario = Usuario.create({
      email: Email.criar('usuario@email.com'),
      role: 'ADMIN',
      senhaHash,
    })

    await usuariosRepository.create(usuario)

    const result = await sut.execute({
      email: usuario.getEmail().getValor(),
      senha: 'invalid-password'
    })

    expect(result.isLeft()).toBe(true)

    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(CredenciaisInvalidasError)
    }
  })
})