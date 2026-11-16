import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Role } from './roles.decorator.js'
import { getJwtSecret } from './jwt-secret.js'

const ROLES_VALIDAS: ReadonlyArray<Role> = ['MECANICO', 'RECEPCAO', 'ADMIN', 'CLIENTE']

/**
 * Payload aceito pela API. Tokens de funcionários são emitidos pela própria API
 * (login por e-mail/senha); tokens de clientes são emitidos pela Lambda de
 * autenticação por CPF, assinados com o mesmo JWT_SECRET.
 */
export type UserPayload = {
  sub: string
  role: Role
  cpf?: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(config),
    })
  }

  async validate(payload: UserPayload): Promise<UserPayload> {
    if (!payload?.sub || !ROLES_VALIDAS.includes(payload.role)) {
      throw new UnauthorizedException('Token com payload inválido.')
    }

    // Retorna o objeto que será injetado em req.user
    return { sub: payload.sub, role: payload.role, ...(payload.cpf && { cpf: payload.cpf }) }
  }
}