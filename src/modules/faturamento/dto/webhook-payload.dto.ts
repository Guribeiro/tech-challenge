import { ApiProperty } from "@nestjs/swagger"
import { WebhookDataDto } from "./webhook-data.dto.js"
import { IsEnum, IsObject, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

export class WebhookPayloadDto {
  @ApiProperty({
    description: 'Evento disparado pelo gateway de pagamento',
    enum: ['payment.succeeded', 'payment.failed'],
    example: 'payment.succeeded',
  })
  @IsEnum(['payment.succeeded', 'payment.failed'])
  event!: 'payment.succeeded' | 'payment.failed'

  @ApiProperty({
    description: 'Dados relativos ao evento de pagamento',
    type: WebhookDataDto,
  })
  @ValidateNested()
  @Type(() => WebhookDataDto)
  @IsObject()
  data!: WebhookDataDto
}