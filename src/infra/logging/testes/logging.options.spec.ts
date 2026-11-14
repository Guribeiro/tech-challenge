import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { pinoHttp } from 'pino-http'
import { criarOpcoesPinoHttp } from '../logging.options.js'

type Linha = Record<string, unknown>

/** Sobe um servidor com o middleware de logs e devolve as linhas JSON emitidas. */
async function executarRequisicao(
  handler: (req: IncomingMessage & { user?: { sub: string; role: string } }, res: ServerResponse) => void,
  headers: Record<string, string> = {},
): Promise<{ linhas: Linha[]; requestIdResposta: string | null }> {
  const linhas: Linha[] = []
  const middleware = pinoHttp(
    criarOpcoesPinoHttp({ ambiente: 'development', nivel: 'info', appEnv: 'hml' }),
    { write: (texto: string) => { linhas.push(JSON.parse(texto)) } },
  )

  const servidor = http.createServer((req, res) => {
    middleware(req, res)
    handler(req, res)
  })
  await new Promise<void>((resolve) => servidor.listen(0, resolve))

  try {
    const { port } = servidor.address() as AddressInfo
    const resposta = await fetch(`http://127.0.0.1:${port}/api/recurso`, { headers })
    await resposta.text()
    await new Promise((resolve) => setTimeout(resolve, 20))
    return { linhas, requestIdResposta: resposta.headers.get('x-request-id') }
  } finally {
    servidor.close()
  }
}

function ocorrencias(linha: Linha, chave: string): number {
  return (JSON.stringify(linha).match(new RegExp(`"${chave}"`, 'g')) ?? []).length
}

describe('criarOpcoesPinoHttp', () => {
  it('reaproveita o x-request-id do API Gateway em todas as linhas, sem duplicar a chave', async () => {
    const { linhas, requestIdResposta } = await executarRequisicao(
      (req, res) => {
        req.log.info('log do caso de uso')
        res.end('ok')
      },
      { 'x-request-id': 'G1-abc123=' },
    )

    expect(requestIdResposta).toBe('G1-abc123=')
    expect(linhas).toHaveLength(2)
    for (const linha of linhas) {
      expect(linha.request_id).toBe('G1-abc123=')
      expect(ocorrencias(linha, 'request_id')).toBe(1)
    }
  })

  it('mantém o log do caso de uso enxuto e o de conclusão com req, status e usuário', async () => {
    const { linhas } = await executarRequisicao((req, res) => {
      req.user = { sub: 'usuario-1', role: 'CLIENTE' }
      req.log.info('log do caso de uso')
      res.statusCode = 201
      res.end('ok')
    })

    const [casoDeUso, conclusao] = linhas

    expect(casoDeUso).not.toHaveProperty('req')
    expect(casoDeUso).toMatchObject({ message: 'log do caso de uso', env: 'hml', level: 'info' })

    expect(conclusao).toMatchObject({
      user_id: 'usuario-1',
      user_role: 'CLIENTE',
      res: { status_code: 201 },
      req: { method: 'GET', url: '/api/recurso' },
    })
    expect(conclusao).toHaveProperty('duration_ms')
    expect(ocorrencias(conclusao, 'user_id')).toBe(1)
  })

  it('gera um request_id quando a requisição não traz um', async () => {
    const { linhas, requestIdResposta } = await executarRequisicao((_req, res) => res.end('ok'))

    expect(requestIdResposta).toMatch(/^[0-9a-f-]{36}$/)
    expect(linhas[0].request_id).toBe(requestIdResposta)
  })
})
