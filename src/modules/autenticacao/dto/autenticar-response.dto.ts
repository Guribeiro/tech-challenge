// src/infra/http/dto/autenticar-response.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import type { Role } from '@/modules/autenticacao/domain/entities/usuario.js'

export class UsuarioResponseDto {
  @ApiProperty({ example: 'usuario@email.com' })
  email!: string

  @ApiProperty({ example: 'MECANICO', enum: ['MECANICO', 'RECEPCAO', 'ADMIN', 'CLIENTE'] })
  role!: Role
}

export class AutenticarResponseDto {
  @ApiProperty({ type: UsuarioResponseDto })
  usuario!: UsuarioResponseDto

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT Bearer token de autenticação',
  })
  accessToken!: string
}