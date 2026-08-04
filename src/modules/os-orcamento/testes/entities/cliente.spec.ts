import { Cliente } from '@/modules/os-orcamento/domain/entities/cliente.js'
import { UniqueEntityID } from '@/core/entities/unique-entity-id.js'
import { Email } from '@/shared/domain/value-objects/email.js'
import { Telefone } from '@/modules/os-orcamento/domain/entities/value-objects/telefone.js'
import { NomeCompleto } from '@/modules/os-orcamento/domain/entities/value-objects/nome-completo.js'
import { Cpf } from '@/modules/os-orcamento/domain/entities/value-objects/cpf.js'
import { ClienteCriadoEvent } from '@/modules/os-orcamento/domain/events/cliente-criado-event.js'
import { RegraDeNegocioVioladaError } from '@/core/errors/domain-errors/index.js'
import { makeCliente } from '../factories/make-cliente.js'

describe('Entidade: Cliente', () => {
  let cpf: Cpf
  let email: Email
  let telefone: Telefone

  beforeEach(() => {
    cpf = makeCliente().getCpf()
    email = makeCliente().getEmail()
    telefone = makeCliente().getTelefone()
  })

  const makePropsValidas = () => ({
    nome: NomeCompleto.criar('João da Silva'),
    email,
    telefone,
    cpf,
    tipo: 'PF' as const,
  })

  describe('Criação do Cliente (criar)', () => {
    it('deve criar um cliente com sucesso e emitir o evento ClienteCriadoEvent', () => {
      const props = makePropsValidas()

      const cliente = Cliente.criar(props)

      expect(cliente.getId()).toBeInstanceOf(UniqueEntityID)
      expect(cliente.getNome().getValor()).toBe('João da Silva')
      expect(cliente.getEmail().getValor()).toBe(email.getValor())
      expect(cliente.getTelefone().getValor()).toBe(telefone.getValor())
      expect(cliente.getCpf().getValor()).toBe(cpf.getValor())
      expect(cliente.getTipo()).toBe('PF')
      expect(cliente.getCriadoEm()).toBeInstanceOf(Date)
      expect(cliente.isDeletado()).toBe(false)
      expect(cliente.getDeletadoEm()).toBeNull()

      // Valida o evento de domínio disparado
      expect(cliente.domainEvents).toHaveLength(1)
      expect(cliente.domainEvents[0]).toBeInstanceOf(ClienteCriadoEvent)
      expect(
        (cliente.domainEvents[0] as ClienteCriadoEvent).getAggregateId()
      ).toEqual(cliente.getId())
    })

    it('não deve emitir ClienteCriadoEvent quando o ID for fornecido (reconstituição)', () => {
      const props = makePropsValidas()
      const customId = new UniqueEntityID('cliente-123')

      const cliente = Cliente.criar(props, customId)

      expect(cliente.getId().toValue()).toBe('cliente-123')
      expect(cliente.domainEvents).toHaveLength(0)
    })
  })

  describe('Atualização de Dados (atualizar)', () => {
    it('deve atualizar os dados do cliente e marcar a data de atualização', () => {
      const cliente = Cliente.criar(makePropsValidas())

      const novoNome = NomeCompleto.criar('João da Silva Sauro')
      const novoTelefone = makeCliente().getTelefone()

      cliente.atualizar({
        nome: novoNome,
        telefone: novoTelefone,
      })

      expect(cliente.getNome().getValor()).toBe(novoNome.getValor())
      expect(cliente.getTelefone().getValor()).toBe(novoTelefone.getValor())
      expect(cliente.getEmail().getValor()).toBe(email.getValor()) // Mantém valor original
      expect(cliente.getAtualizadoEm()).toBeInstanceOf(Date)
    })
  })

  describe('Exclusão (deletar)', () => {
    it('deve realizar a exclusão lógica (soft delete) do cliente com sucesso', () => {
      const cliente = Cliente.criar(makePropsValidas())

      cliente.deletar()

      expect(cliente.isDeletado()).toBe(true)
      expect(cliente.getDeletadoEm()).toBeInstanceOf(Date)
      expect(cliente.getAtualizadoEm()).toBeInstanceOf(Date)
    })

    it('deve lançar RegraDeNegocioVioladaError ao tentar deletar um cliente já excluído', () => {
      const cliente = Cliente.criar(makePropsValidas())

      cliente.deletar()

      expect(() => {
        cliente.deletar()
      }).toThrow(RegraDeNegocioVioladaError)
    })
  })
})