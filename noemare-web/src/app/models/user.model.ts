// Define os tipos de acesso que criámos no Java
export type RoleFuncionario = 'ADMIN' | 'USER';

// Define os estados da conta
export type StatusConta = 'ATIVO' | 'INATIVO';

export interface User {
  id?: number;
  nome: string;
  sobrenome: string;
  email: string;
  role: RoleFuncionario;
  statusConta: StatusConta;
}

// Interface para a resposta do endpoint de Login
export interface LoginResponse {
  token: string;
}

// Interface para os dados de registo (incluindo a confirmação e o código mestre)
export interface RegistroRequest {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
  role: RoleFuncionario;
  codigoMestre?: string;
}
