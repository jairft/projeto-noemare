export interface EmprestimoRequest { // Atualizado
  fornecedorId: number;
  valorTotal: number;
  tipo: string;
  descricao: string;
  dataEmprestimo: string; // Atualizado: deve bater com o campo do backend
}

export interface EmprestimoResponse { // Atualizado
  id: number;
  fornecedorId: number;
  fornecedorNome: string;
  tipo: string;
  valorTotal: number;
  saldoRestante: number;
  status: string;
  dataEmprestimo: string; // Atualizado
  descricao: string;
}

export interface PagamentoEmprestimoRequest { // Atualizado
  emprestimoId: number; // Atualizado: deve bater com o request.emprestimoId() do Java
  valor: number;
  descricao?: string;
}