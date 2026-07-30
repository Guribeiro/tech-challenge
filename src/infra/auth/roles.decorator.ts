// src/infra/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common'

export type Role = 'MECANICO' | 'RECEPCAO' | 'ADMIN' | 'CLIENTE'

export const ROLES_KEY = 'roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)