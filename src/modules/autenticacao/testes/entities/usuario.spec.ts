import { describe, it, expect } from 'vitest'
import { Usuario } from '../../domain/entities/usuario.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { UsuarioCriadoEvent } from '../../domain/events/usuario-criado-event.js'

describe('Entidade: Usuario', () => {
  it('deve instanciar um usuário com sucesso', () => {
    const email = Email.criar('usuario@oficina.com')

    const usuario = Usuario.create({
      email,
      senhaHash: '$2b$10$hashedpasswordsample',
      role: 'MECANICO',
    })

    expect(usuario.getId()).toBeDefined()
    expect(usuario.getId()).toBeInstanceOf(UniqueEntityID)
    expect(usuario.getEmail().getValor()).toBe('usuario@oficina.com')
    expect(usuario.getSenhaHash()).toBe('$2b$10$hashedpasswordsample')
    expect(usuario.getRole()).toBe('MECANICO')
    expect(usuario.getCriadoEm()).toBeInstanceOf(Date)
    expect(usuario.getAtualizadoEm()).toBeUndefined()
  })

  it('deve registrar o evento UsuarioCriadoEvent quando senhaPlana for fornecida', () => {
    const email = Email.criar('admin@oficina.com')
    const senhaPlana = 'Senha@123'

    const usuario = Usuario.create(
      {
        email,
        senhaHash: '$2b$10$hashedpasswordsample',
        role: 'ADMIN',
      },
      undefined,
      senhaPlana
    )

    expect(usuario.domainEvents).toHaveLength(1)
    expect(usuario.domainEvents[0]).toBeInstanceOf(UsuarioCriadoEvent)

    const evento = usuario.domainEvents[0] as UsuarioCriadoEvent
    expect(evento.senhaPlana).toBe(senhaPlana)
    expect(evento.getAggregateId()).toEqual(usuario.getId())
  })

  it('não deve registrar o evento UsuarioCriadoEvent se senhaPlana não for informada', () => {
    const email = Email.criar('recepcao@oficina.com')

    const usuario = Usuario.create({
      email,
      senhaHash: '$2b$10$hashedpasswordsample',
      role: 'RECEPCAO',
    })

    expect(usuario.domainEvents).toHaveLength(0)
  })

  it('deve manter o ID customizado quando passado via parâmetro', () => {
    const email = Email.criar('cliente@oficina.com')
    const customId = new UniqueEntityID('custom-user-id-123')

    const usuario = Usuario.create(
      {
        email,
        senhaHash: '$2b$10$hashedpasswordsample',
        role: 'CLIENTE',
      },
      customId
    )

    expect(usuario.getId().toValue()).toBe('custom-user-id-123')
  })
})