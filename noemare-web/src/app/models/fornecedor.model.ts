export type StatusNota = 'ABERTA' | 'PARCIAL' | 'PAGA' | 'CANCELADA';
export type StatusFornecedor = 'ATIVO' | 'INATIVO';

export interface Fornecedor {
  id: number;
  nome: string;
  saldoDevedorInvestimento: number; 
  saldoDevedorAdiantamento: number;
  saldoCredor: number;
  dataCadastro: string;
  status: StatusFornecedor;
}

export interface ItemAgrupado {
  nomeProduto: string;
  tipo: string;    // 👉 ex: Viva, Congelada
  tamanho: string; // 👉 ex: P, M, G, 100/200
  totalKg: number;
  totalValor: number;
}

export interface ItemNotaHistorico {
  nomeProduto: string;
  tipo: string;
  tamanho: string;
  quantidadeKg: number;
  valorItem: number; // Valor pago por este item específico nesta nota
}

export interface NotaHistorico {
  id: number; 
  numeroNota: string; 
  dataNota: string; // 👉 ATUALIZADO: Bate com o Java (era dataEmissao)
  valorTotalNota: number; // 👉 ATUALIZADO: Bate com o Java (era valorTotal)
  status: StatusNota; 
  itens: ItemNotaHistorico[];
}

export interface HistoricoGeral {
  kgGeral: number;
  valorGeral: number;
  itensAgrupados: ItemAgrupado[];
  notas: NotaHistorico[]; 
}