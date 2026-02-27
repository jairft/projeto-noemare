// src/app/models/relatorio-anual.ts

export interface ItemRelatorioResponse {
  produto: string;      
  quantidadeKg: number; 
  valorTotal: number;
  precoUnitario: number;
}

// 👉 NOVO: Interface específica para a linha do fornecedor no relatório
export interface FornecedorRelatorioResponse {
  nome: string;
  totalComprado: number;
  totalPago: number;
  pendenciaNotas: number;
  saldoDevedor: number; // Referente ao Adiantamento
  saldoInvestimento: number; // 👉 NOVO: Referente ao Investimento
}

export interface RelatorioAnualResponse {
  totalCompradoGeral: number;
  totalPagoGeral: number;
  saldoPendenteGeral: number;
  totalKgGeral: number;
  fornecedores: FornecedorRelatorioResponse[]; // 👉 Atualizado de any[] para a interface tipada
  itens: ItemRelatorioResponse[]; 
  volumePorMes: number[]; 
}