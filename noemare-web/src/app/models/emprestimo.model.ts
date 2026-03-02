
export interface PagamentoEmprestimoResponse {
  id: number;
  emprestimoId: number;
  valor: number;
  descricao: string;
  dataPagamento: string;
}

export interface EmprestimoRequest { 
  fornecedorId: number;
  valorTotal: number;
  tipo: string;
  descricao: string;
  dataEmprestimo: string; 
}

export interface EmprestimoResponse { 
  id: number;
  fornecedorId: number;
  fornecedorNome: string;
  tipo: string;
  valorTotal: number;
  saldoRestante: number;
  status: string;
  dataEmprestimo: string; 
  descricao: string;
  pagamentos: PagamentoEmprestimoResponse[];
}

export interface PagamentoEmprestimoRequest { 
  emprestimoId: number; 
  valor: number;
  descricao?: string;
}