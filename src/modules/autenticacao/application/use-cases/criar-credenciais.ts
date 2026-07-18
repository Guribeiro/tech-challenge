import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { HashGenerator } from '@/modules/autenticacao/domain/cryptography/hash-generator.js'
import { Usuario } from '@/modules/autenticacao/domain/entities/usuario.js'
import { UsuariosRepository } from '@/modules/autenticacao/domain/repositories/usuarios-repository.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { randomBytes } from 'node:crypto';

interface CriarCredenciaisInput {
  id: string
  email: string
  role: 'MECANICO' | 'RECEPCAO' | 'ADMIN'
}

export class CriarCredenciaisUseCase {
  constructor(
    private readonly usuariosRepository: UsuariosRepository,
    private readonly hashGenerator: HashGenerator,
  ) { }

  async execute({ id, email, role }: CriarCredenciaisInput): Promise<void> {
    const usuarioExistente = await this.usuariosRepository.findByEmail(email)
    if (usuarioExistente) return

    const senhaPlanaProvisoria = `oficina-${randomBytes(3).toString('hex')}`

    const senhaHash = await this.hashGenerator.generateHash(senhaPlanaProvisoria)

    const usuario = Usuario.create(
      {
        email: Email.criar(email),
        senhaHash,
        role
      },
      new UniqueEntityID(id),
      senhaPlanaProvisoria
    )

    await this.usuariosRepository.create(usuario)
  }
}