import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const REQUEST_ID_HEADER = 'x-request-id'

// Cabeçalhos aceitos como correlation id, em ordem de prioridade:
// - x-request-id: propagado pelo API Gateway ($context.requestId) ou pelo cliente
// - x-correlation-id: convenção comum entre serviços
const CABECALHOS_CORRELACAO = [REQUEST_ID_HEADER, 'x-correlation-id'] as const

const FORMATO_VALIDO = /^[\w.:\-=/+]{1,128}$/

function lerCabecalho(req: IncomingMessage, nome: string): string | undefined {
  const valor = req.headers[nome]
  const texto = Array.isArray(valor) ? valor[0] : valor
  return texto && FORMATO_VALIDO.test(texto) ? texto : undefined
}

/**
 * Resolve o correlation id da requisição reaproveitando o recebido do API Gateway
 * (ou gerando um novo) e devolve no cabeçalho de resposta para rastreio ponta a ponta.
 */
export function resolverRequestId(req: IncomingMessage, res: ServerResponse): string {
  const existente = CABECALHOS_CORRELACAO.map((nome) => lerCabecalho(req, nome)).find(Boolean)
  const requestId = existente ?? randomUUID()

  res.setHeader(REQUEST_ID_HEADER, requestId)

  return requestId
}
