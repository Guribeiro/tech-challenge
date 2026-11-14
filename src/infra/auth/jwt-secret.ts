import { ConfigService } from '@nestjs/config'

const SEGREDO_DESENVOLVIMENTO = 'sua-chave-secreta-default'

/**
 * Em produção o JWT_SECRET é obrigatório (injetado a partir do AWS Secrets Manager
 * e compartilhado com a Lambda de autenticação). O valor padrão só é aceito fora de produção.
 */
export function getJwtSecret(config: ConfigService): string {
  const secret = config.get<string>('JWT_SECRET')

  if (secret) return secret

  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error('JWT_SECRET não configurado.')
  }

  return SEGREDO_DESENVOLVIMENTO
}
