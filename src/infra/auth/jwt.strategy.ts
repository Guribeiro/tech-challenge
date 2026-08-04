import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

export type UserPayload = {
  sub: string
  role: 'MECANICO' | 'RECEPCAO' | 'ADMIN'
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'sua-chave-secreta-default'),
    })
  }

  async validate(payload: UserPayload) {
    // Retorna o objeto que será injetado em req.user
    return { sub: payload.sub, role: payload.role }
  }
}