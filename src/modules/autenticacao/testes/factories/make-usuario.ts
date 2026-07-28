import { faker } from '@faker-js/faker'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Usuario, Role } from '../../domain/entities/usuario.js'

export function makeUsuario(
  override: Partial<Parameters<typeof Usuario.create>[0]> = {},
  id?: UniqueEntityID,
  senhaPlana?: string
) {
  const roles: Role[] = ['MECANICO', 'RECEPCAO', 'ADMIN', 'CLIENTE']

  const usuario = Usuario.create(
    {
      email: Email.criar(faker.internet.email()),
      senhaHash: faker.internet.password({ length: 10 }),
      role: faker.helpers.arrayElement(roles),
      ...override,
    },
    id,
    senhaPlana
  )

  return usuario
}