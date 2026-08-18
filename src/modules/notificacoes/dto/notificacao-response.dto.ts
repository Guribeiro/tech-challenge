import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class NotificacaoResponseDto {
  @ApiProperty({
    description: 'Identificador único da notificação',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string

  @ApiProperty({
    description: 'Título da notificação',
    example: 'Orçamento aprovado',
  })
  titulo!: string

  @ApiProperty({
    description: 'Conteúdo da notificação',
    example: 'Seu orçamento foi aprovado e a OS está liberada para execução.',
  })
  conteudo!: string

  @ApiPropertyOptional({
    description: 'Template da notificação quando aplicável',
    example: 'orcamento-aprovado',
    nullable: true,
  })
  template?: string | null

  @ApiPropertyOptional({
    description: 'Dados de contexto adicionais da notificação',
    example: { orcamentoId: '123e4567-e89b-12d3-a456-426614174000' },
    type: Object,
    nullable: true,
  })
  contexto?: Record<string, unknown> | null

  @ApiPropertyOptional({
    description: 'Data e hora em que a notificação foi marcada como lida',
    example: '2026-07-30T14:00:00.000Z',
    nullable: true,
  })
  lidaEm?: Date | null

  @ApiProperty({
    description: 'Data e hora de criação da notificação',
    example: '2026-07-30T13:45:00.000Z',
  })
  criadaEm!: Date
}
