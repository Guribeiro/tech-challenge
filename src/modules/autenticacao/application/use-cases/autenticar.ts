import { HashGenerator } from '@/modules/autenticacao/domain/cryptography/hash-generator.js'
import { UsuariosRepository } from '@/modules/autenticacao/domain/repositories/usuarios-repository.js'
import { Encrypter } from '../../domain/cryptography/encrypter.js'
import { Injectable } from '@nestjs/common'

interface AutenticarInput {
  email: string
  senha: string
}

interface AutenticarOutput {
  accessToken: string
}

@Injectable()
export class AutenticarUseCase {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly encrypter: Encrypter,
  ) { }

  async execute({ email, senha }: AutenticarInput): Promise<AutenticarOutput> {
    const usuario = await this.usuariosRepository.findByEmail(email)

    if (!usuario) {
      throw new Error('email/senha incorreto');
    }

    const passwordMatch = await this.hashGenerator.compareHash(
      senha,
      usuario.getSenhaHash()
    )

    if (!passwordMatch) {
      throw new Error('email/senha incorreto');
    }

    const accessToken = await this.encrypter.encrypt({
      role: usuario.getRole(),
      sub: usuario.getId().toValue()
    })

    return {
      accessToken
    }
  }
}