// src/domain/notification/services/email-service.ts
export interface EnviarEmailProps {
  para: string
  assunto: string
  template?: string
  contexto?: Record<string, unknown>
  textoPlano?: string
}

export abstract class EmailService {
  abstract enviar(props: EnviarEmailProps): Promise<void>
}