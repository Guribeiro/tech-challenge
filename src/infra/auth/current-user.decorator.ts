import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { UserPayload } from './jwt.strategy.js'

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const user = request.user as UserPayload

    // Se você passar uma propriedade ex: @CurrentUser('sub'), retorna apenas ela
    return data ? user?.[data] : user
  },
)