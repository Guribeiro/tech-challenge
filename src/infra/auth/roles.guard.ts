// src/infra/auth/roles.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator.js'
import { UserPayload } from './jwt.strategy.js'

// Interface para garantir o contrato do payload do usuário logado


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // Busca os papéis definidos no método da rota ou na classe do controller
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // Se a rota não exige nenhuma role específica, permite o acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as UserPayload

    if (!user?.role) {
      throw new ForbiddenException('Usuário não possui perfis de acesso atribuídos.')
    }

    const hasRole = requiredRoles.includes(user.role)

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Perfil exigido: [${requiredRoles.join(', ')}]. Perfil do usuário: ${user.role}`
      )
    }

    return true
  }
}