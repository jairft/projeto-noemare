export interface NotaItem {
  id?: number;
  produtoId: number;    
  nomeProduto?: string; 
  tipo: string;
  tamanho: string;
  quantidadeKg: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface PagamentoNotaRequest {
  notaId: number;
  valorPagoDinheiro: number;
  valorAbatidoInvestimento: number;
  valorAbatidoAdiantamento: number;
  dataOperacao: string;
  observacao?: string;
}

export interface PagamentoNotaResponse {
  id: number;
  valorPagoDinheiro: number;
  valorAbatidoInvestimento: number;
  valorAbatidoAdiantamento: number;
  dataOperacao: string;
  observacao?: string;
}

// ⚠️ ATUALIZADO: Inclui os novos campos do cabeçalho da nota
export interface SalvarNotaRequest {
  fornecedorId: number;
  numeroNota?: string;  // <-- Adicionado
  dataNota: string;     // <-- Adicionado
  descricao?: string;
  itens: Array<{
    produtoId: number;   
    quantidadeKg: number;
    valorUnitario: number;
  }>;
}

export interface HistoricoNotaItemResponse {
  produtoNome: string;
  tipo: string;
  tamanho: string;
  quantidadeKg: number;
  valorUnitario: number;
  valorTotal: number;
}

// ⚠️ ATUALIZADO: Preparado para receber o número da nota na listagem
export interface HistoricoNotaResponse {
  id: number;
  numeroNota?: string;  // <-- Adicionado para exibir no histórico/tabela
  dataNota: string;
  fornecedorNome: string;
  valorTotal: number;
  status: string;
  itens: HistoricoNotaItemResponse[];
}