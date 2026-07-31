import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { AppModule } from '@/infra/nest/app.module.js'
import { PrismaService } from '@/infra/database/prisma/prisma.service.js'
import { makeUsuarioAutenticado } from '@/modules/autenticacao/testes/factories/make-usuario-autenticado.js'
import { generate as gerarCpf } from 'gerador-validador-cpf'
import { makeRecepcionista } from '../../factories/make-recepcionista.js'

describe('Controller: Criar Recepcionista (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let baseUrl: string

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)

    await app.listen(0)

    baseUrl = await app.getUrl()
  })

  beforeEach(async () => {
    await prisma.recepcionista.deleteMany()
    await prisma.usuario.deleteMany()
  })

  afterAll(async () => {
    await app.close()
  })

  it('[POST] /recepcionistas - deve criar um recepcionista com sucesso', async () => {
    const { accessToken } = await makeUsuarioAutenticado(app, { role: 'ADMIN' })

    // 1. Defina o e-mail diretamente em uma constante fixa para o teste
    const email = 'juliana.recepcao@oficina.com'
    const cpf = gerarCpf()

    const response = await fetch(`${baseUrl}/recepcionistas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        nome: 'Juliana Costa',
        email,
        cpf,
      }),
    })

    // 💡 Lendo o body para garantir que a requisição não retornou erro sem estourar o status
    const body = await response.json()

    expect(response.status).toBe(200)

    // 2. Se a Recepcionista for salva na tabela `recepcionista`:
    const recepcionistaNoBanco = await prisma.recepcionista.findFirst({
      where: { email }, // ou { cpf } dependendo de onde o campo fica no seu schema
    })

    // 3. Caso a Recepcionista seja gravada como Usuario no banco:
    // const recepcionistaNoBanco = await prisma.usuario.findUnique({
    //   where: { email },
    // })

    expect(recepcionistaNoBanco).toBeTruthy()
  })
})