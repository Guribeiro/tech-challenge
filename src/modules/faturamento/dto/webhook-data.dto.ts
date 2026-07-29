import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsUUID } from "class-validator"

export class WebhookDataDto {
  @ApiProperty({
    description: 'ID único (UUID) da fatura',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  faturaId!: string

  @ApiProperty({
    description: 'ID da transação retornado pelo gateway de pagamento',
    example: 'tx_987654321',
  })
  @IsNotEmpty()
  transactionId!: string
}