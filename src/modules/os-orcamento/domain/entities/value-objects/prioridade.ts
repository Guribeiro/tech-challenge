export type TipoPrioridade = 'URGENTE' | 'ALTA' | 'MEDIA' | 'BAIXA';

// Interface com os dados necessários para o cálculo, desacoplada das entidades brutas
export type DadosParaPriorizacao = {
  eGarantia: boolean;
  eClienteCorporativo: boolean; // Ex: Frotista, Locadora, Táxi
  anoVeiculo: number;
  categoriasDosServicos: string[]; // Ex: ['FREIO', 'REVISAO', 'FUNILARIA']
};

export type RestaurarPrioridadeProps = {
  tipo: TipoPrioridade
  peso: number
}

export class Prioridade {
  private readonly tipo: TipoPrioridade;
  private readonly peso: number;

  private constructor(tipo: TipoPrioridade, peso: number) {
    this.tipo = tipo;
    this.peso = peso;
  }

  /**
   * Calcula a prioridade com base em uma matriz de pontos acumulativa
   */
  public static calcular(dados: DadosParaPriorizacao): Prioridade {
    let pontos = 0;

    // 1. Regras do Cliente / Contrato
    if (dados.eGarantia) pontos += 40;
    if (dados.eClienteCorporativo) pontos += 30;

    // 2. Regras do Veículo (Carros mais novos ou frotas operacionais têm SLA mais rígido)
    const anoAtual = new Date().getFullYear();
    const idadeDoVeiculo = anoAtual - dados.anoVeiculo;
    if (idadeDoVeiculo <= 3) {
      pontos += 15; // Carros novos/revisões de fábrica
    }

    // 3. Regras dos Serviços (Avaliando as categorias técnicas estruturadas)
    dados.categoriasDosServicos.forEach(categoria => {
      switch (categoria.toUpperCase()) {
        case 'SEGURANCA': // Ex: Freios, Direção, Suspensão quebrada
          pontos += 50;
          break;
        case 'MANUTENCAO_PREVENTIVA': // Ex: Troca de óleo, alinhamento rápido
          pontos += 20;
          break;
        case 'ESTETICA': // Ex: Polimento, Higienização
          pontos += 5;
          break;
        default:
          pontos += 10;
      }
    });

    // 4. Classificação do Peso Final baseado no Score
    if (pontos >= 80) return new Prioridade('URGENTE', 4);
    if (pontos >= 50) return new Prioridade('ALTA', 3);
    if (pontos >= 25) return new Prioridade('MEDIA', 2);

    return new Prioridade('BAIXA', 1);
  }

  public static restaurar(tipo: TipoPrioridade, peso: number): Prioridade {
    return new Prioridade(tipo, peso);
  }

  public getTipo(): TipoPrioridade {
    return this.tipo;
  }
  public getPeso(): number {
    return this.peso;
  }
}