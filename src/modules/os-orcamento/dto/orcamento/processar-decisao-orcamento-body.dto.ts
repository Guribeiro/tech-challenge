import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class ProcessarDecisaoOrcamentoBodyDTO {
  @ApiProperty({
    description: 'Decisão do cliente sobre o orçamento',
    enum: ['APROVADO', 'RECUSADO'],
    example: 'APROVADO',
  })
  @IsEnum(['APROVADO', 'RECUSADO'])
  @IsNotEmpty()
  decisao!: 'APROVADO' | 'RECUSADO'

  @ApiProperty({
    description: 'Motivo da recusa (opcional, obrigatório caso recusado)',
    required: false,
    example: 'Valor acima do orçamento esperado',
  })
  @IsString()
  @IsOptional()
  motivoRecusa?: string
}