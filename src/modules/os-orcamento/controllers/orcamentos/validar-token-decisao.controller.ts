import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common'
import type { Response } from 'express'
import { ValidarTokenOrcamentoUseCase } from '../../application/use-cases/orcamento/validar-token-orcamento.js'
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('Orçamentos')
@Controller('orcamentos')
export class ValidarTokenDecisaoController {
  constructor(
    private readonly validarTokenOrcamento: ValidarTokenOrcamentoUseCase,
  ) { }

  @Get('decisoes/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar token de decisão de orçamento',
    description:
      'Valida o token enviado por e-mail para permitir que o cliente aprove ou recuse um orçamento de forma segura.',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único de segurança enviado por e-mail',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token válido. Página de decisão renderizada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Token inválido ou expirado.',
    schema: {
      example: {
        statusCode: 400,
        message: 'Link inválido ou expirado.',
        error: 'Bad Request',
      },
    },
  })
  async handle(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const result = await this.validarTokenOrcamento.execute({ token })

    if (result.isLeft()) {
      // Retorna uma página HTML informando que o link é inválido ou expirado
      return res.status(HttpStatus.BAD_REQUEST).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding-top: 50px;">
            <h2 style="color: #e74c3c;">Link inválido ou expirado</h2>
            <p>Este link de aprovação não é mais válido ou já foi utilizado.</p>
          </body>
        </html>
      `)
    }

    // Se o token for válido, renderiza a página de decisão com os botões
    return res.send(`
      <html>
        <head>
          <title>Aprovação de Orçamento</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f4f7f6; text-align: center; padding-top: 50px; }
            .container { background: white; max-width: 400px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            button { padding: 10px 20px; font-size: 16px; border: none; border-radius: 4px; cursor: pointer; color: white; margin: 10px; }
            .btn-aprovar { background: #2ecc71; }
            .btn-reprovar { background: #e74c3c; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Decisão do Orçamento</h2>
            <p>Escolha uma das opções abaixo para responder ao orçamento:</p>
            <button id="aprovar" class="btn-aprovar" type="button">Aprovar</button>
            <button id="recusar" class="btn-reprovar" type="button">Recusar</button>
            <p id="mensagem" style="margin-top: 20px; font-weight: bold;"></p>
          </div>

          <script>
            async function enviarDecisao(decisao) {
              const motivoRecusa = decisao === 'RECUSADO' ? prompt('Informe o motivo da recusa (opcional):') : null;
                 const acao = decisao === 'APROVADO' ? 'aprovar' : 'recusar';

              if (!window.confirm('Confirmar decisão?')) {
                return;
              }

              const botoesDecisao = document.querySelectorAll('#aprovar, #recusar');
              botoesDecisao.forEach((botao) => botao.disabled = true);
              document.getElementById('mensagem').innerText = 'Enviando decisão...';
              try {
                const response = await fetch(window.location.pathname, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ decisao, motivoRecusa })
                });

                if (response.ok) {
                  document.getElementById('mensagem').style.color = '#2ecc71';
                  document.getElementById('mensagem').innerText = 'Decisão registrada com sucesso! Pode fechar esta janela.';
                } else {
                  throw new Error();
                }
              } catch (err) {
                botoesDecisao.forEach((botao) => botao.disabled = false);
                document.getElementById('mensagem').style.color = '#e74c3c';
                document.getElementById('mensagem').innerText = 'Erro ao processar a decisão. Tente novamente.';
              }
            }
            document.getElementById('aprovar').addEventListener('click', () => enviarDecisao('APROVADO'));
            document.getElementById('recusar').addEventListener('click', () => enviarDecisao('RECUSADO'));
          </script>
        </body>
      </html>
    `)
  }
}