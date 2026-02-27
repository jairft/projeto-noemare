export type StatusNota = 'ABERTA' | 'PARCIAL' | 'PAGA' | 'CANCELADA';


export interface ItemAgrupado {
  nomeProduto: string;
  tipo: string;    // 👉 Novo campo (ex: Viva, Congelada)
  tamanho: string; // 👉 Novo campo (ex: P, M, G, 100/200)
  totalKg: number;
  totalValor: number;
}

export interface HistoricoGeral {
  kgGeral: number;
  valorGeral: number;
  itensAgrupados: ItemAgrupado[];
}




export interface Fornecedor {
  id: number;
  nome: string;
  saldoDevedorInvestimento: number; 
  saldoDevedorAdiantamento: number;
  saldoCredor: number;
  dataCadastro: string;
  status: StatusFornecedor;
}



/**
 * Tipo para garantir que o status aceite apenas 
 * os valores definidos no Enum do Spring Boot.
 */
export type StatusFornecedor = 'ATIVO' | 'INATIVO';