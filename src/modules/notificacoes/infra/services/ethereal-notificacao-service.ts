import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as handlebarsModule from 'handlebars'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { EnviarNotificacaoProps, NotificacaoService } from '../../domain/services/notificacao-service.js'

const Handlebars = (handlebarsModule as any).default || handlebarsModule
@Injectable()
export class EtherealNotificacaoService implements NotificacaoService, OnModuleInit {
  private transporter!: nodemailer.Transporter
  private readonly logger = new Logger(EtherealNotificacaoService.name)

  async onModuleInit() {
    // Cria uma conta de teste temporária no Ethereal
    const testAccount = await nodemailer.createTestAccount()

    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    this.logger.log(`Ethereal SMTP inicializado | Usuário: ${testAccount.user}`)
  }

  async enviar({ destinatario, assunto, mensagem, template, contexto }: EnviarNotificacaoProps): Promise<void> {
    let htmlContent: string | undefined

    if (template) {
      htmlContent = await this.compilarTemplate(template, contexto || {})
    }

    const info = await this.transporter.sendMail({
      from: '"Oficina Auto" <nao-responda@oficina.com.br>',
      to: destinatario,
      subject: assunto,
      text: mensagem,
      html: htmlContent,
    })

    this.logger.log(`[Ethereal] E-mail disparado para ${destinatario} | MessageID: ${info.messageId}`)

    // Gera o link para você clicar no terminal e abrir o e-mail no navegador
    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      this.logger.log(`[Ethereal Preview URL]: ${previewUrl}`)
    }
  }

  private async resolverCaminhoTemplate(nomeTemplate: string): Promise<string> {
    const nomeArquivo = `${nomeTemplate}.hbs`

    // 1. Tenta encontrar na pasta dist (Produção / Docker)
    const caminhoDist = path.resolve(
      process.cwd(),
      'dist',
      'modules',
      'notificacoes',
      'infra',
      'templates',
      nomeArquivo
    )

    // 2. Tenta encontrar na pasta src (Desenvolvimento local / ts-node / vitest)
    const caminhoSrc = path.resolve(
      process.cwd(),
      'src',
      'modules',
      'notificacoes',
      'infra',
      'templates',
      nomeArquivo
    )

    try {
      await fs.access(caminhoDist)
      return caminhoDist
    } catch {
      try {
        await fs.access(caminhoSrc)
        return caminhoSrc
      } catch {
        this.logger.error(
          `Template não encontrado em nenhum dos caminhos esperados:\n - ${caminhoDist}\n - ${caminhoSrc}`
        )
        throw new Error(`Arquivo de template não encontrado: ${nomeArquivo}`)
      }
    }
  }

  private async compilarTemplate(templateName: string, contexto: Record<string, unknown>): Promise<string> {
    try {
      const templatePath = await this.resolverCaminhoTemplate(templateName)
      const templateSource = await fs.readFile(templatePath, 'utf-8')
      const compiledTemplate = Handlebars.compile(templateSource)
      return compiledTemplate(contexto)
    } catch (error) {
      this.logger.error(`Falha ao carregar o template no caminho: ${templateName}`, error)
      throw new Error(`Não foi possível carregar o template de e-mail: ${templateName}`)
    }
  }
}