import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmprestimoRequest, EmprestimoResponse, PagamentoEmprestimoRequest } from '../models/emprestimo.model'; // Ajuste o caminho conforme seu projeto

@Injectable({
  providedIn: 'root'
})
export class EmprestimoService {
  private readonly http = inject(HttpClient);
  
  // URL atualizada para bater com o Controller do Spring Boot
  private readonly API = `${environment.apiUrl}/emprestimos`;

  /**
   * Envia os dados do novo empréstimo para o back-end.
   */
  salvar(payload: EmprestimoRequest): Observable<EmprestimoResponse> {
    return this.http.post<EmprestimoResponse>(this.API, payload);
  }

  /**
   * Busca a lista de todos os empréstimos.
   */
  listarTodos(): Observable<EmprestimoResponse[]> {
    return this.http.get<EmprestimoResponse[]>(this.API);
  }

  /**
   * Busca os detalhes de um empréstimo específico por ID, incluindo a lista de pagamentos.
   * Traz os empréstimos do tipo INVESTIMENTO já com a lista de pagamentos embutida.
   */
  listarHistoricoInvestimentos(fornecedorId: number): Observable<EmprestimoResponse[]> {
    return this.http.get<EmprestimoResponse[]>(`${this.API}/fornecedor/${fornecedorId}/investimentos`);
  }

  /**
   * Registra um pagamento/abatimento para um empréstimo específico.
   */
  registrarPagamento(payload: PagamentoEmprestimoRequest): Observable<any> {
    // URL atualizada para bater com o PagamentoEmprestimoController
    const URL_PAGAMENTO = `${environment.apiUrl}/pagamentos-emprestimo`;
    return this.http.post<any>(URL_PAGAMENTO, payload);
  }

  /**
   * Gera um relatório PDF do histórico de investimentos para um fornecedor específico.
   * O responseType 'blob' é obrigatório para o Angular entender que é um arquivo.
   */
  gerarRelatorioPdfInvestimentos(fornecedorId: number): Observable<Blob> {
    return this.http.get(`${this.API}/fornecedor/${fornecedorId}/investimentos/relatorio-pdf`, { 
      responseType: 'blob' 
    });
  }
}