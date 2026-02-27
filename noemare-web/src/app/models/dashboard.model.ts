export interface ProducaoItemResumoResponse {
  nomeProduto: string;
  tipoProduto: string;
  tamanho: string;
  totalKg: number;
}

export interface HistoricoIndividualFornecedorResponse {
  id: number;
  nomeFornecedor: string;
  saldoAdiantamento: number;
  saldoInvestimento: number;
  investimentoPago: number; // 👉 NOVO CAMPO
  saldoNotas: number;
  saldoLiquido: number;
  producao: any[];
}

export interface DashboardFornecedorResponse {
  totalAdiantadoGlobal: number;
  totalNotasGlobal: number;
  totalInvestimentoGlobal: number;
  totalPagoInvestimentoGlobal: number; // 👉 NOVO CAMPO
  totalLiquidoAPagar: number;
  totalLiquidoAReceber: number;
  fornecedores: HistoricoIndividualFornecedorResponse[];
}