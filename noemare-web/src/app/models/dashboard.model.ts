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

// Atualize ou crie a interface principal do topo do Dashboard
export interface DashboardResumoResponse {
  totalAPagar: number;
  totalAdiantado: number;
  totalPagoMes: number;
  notasPendentes: number;
  volumePorMes: { [key: number]: number }; 
  volumeTotalAno: number; // 👉 É ESTE CAMPO AQUI QUE VAI TIRAR O "CARREGANDO..."!
}