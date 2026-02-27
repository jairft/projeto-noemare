export interface RegistroRequest {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
  confirmacaoSenha: string;
  role: 'ADMIN' | 'USER';
  codigoMestre?: string;
}
