/**
 * Lógica de cálculo compartilhada para frontend
 */

export interface CalculationInput {
  distanciaKm: number;
  kmPorLitro: number;
  precoDieselLitro: number;
  velocidadeMediaKmh: number;
  custosVariaveis: Array<{ valor_por_km: number }>;
  pedagios: Array<{ valor: number }>;
  custosFixos: Array<{ valor_mensal: number }>;
  entregasNaRota?: number;
}

export interface CalculationResult {
  consumoCombustivelL: number;
  custoCombustivel: number;
  custoVariaveis: number;
  custoPedagios: number;
  custoFixoRateado: number;
  custoTotal: number;
  custoPorEntrega?: number;
  tempoEstimadoH: number;
}

export function calcularCustos(input: CalculationInput): CalculationResult {
  // 1. Consumo de combustível
  const consumoCombustivelL = input.distanciaKm / input.kmPorLitro;

  // 2. Custo de combustível
  const custoCombustivel = consumoCombustivelL * input.precoDieselLitro;

  // 3. Custos variáveis
  const somaCustosVariaveis = input.custosVariaveis.reduce(
    (sum, custo) => sum + Number(custo.valor_por_km),
    0
  );
  const custoVariaveis = somaCustosVariaveis * input.distanciaKm;

  // 4. Pedágios
  const custoPedagios = input.pedagios.reduce(
    (sum, pedagio) => sum + Number(pedagio.valor),
    0
  );

  // 5. Custo fixo diário
  const somaCustosFixos = input.custosFixos.reduce(
    (sum, custo) => sum + Number(custo.valor_mensal),
    0
  );
  const custoFixoRateado = somaCustosFixos / 30;

  // 6. Custo total
  const custoTotal = custoCombustivel + custoVariaveis + custoPedagios + custoFixoRateado;

  // 7. Tempo estimado
  const tempoEstimadoH = input.distanciaKm / input.velocidadeMediaKmh;

  // 8. Custo por entrega
  const custoPorEntrega = input.entregasNaRota
    ? custoTotal / input.entregasNaRota
    : undefined;

  return {
    consumoCombustivelL,
    custoCombustivel,
    custoVariaveis,
    custoPedagios,
    custoFixoRateado,
    custoTotal,
    custoPorEntrega,
    tempoEstimadoH,
  };
}
