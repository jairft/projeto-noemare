import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HistoricoNotaResponse, PagamentoNotaRequest, SalvarNotaRequest } from '../models/nota.model';
 // Interface que criaremos abaixo

@Injectable({
  providedIn: 'root'
})
export class NotaFornecedorService {
  private readonly http = inject(HttpClient);
  
  // Rota para gestão de Notas
  private readonly API_NOTAS = `${environment.apiUrl}/notas-fornecedor`;
  
  // Nova rota para o PagamentoNotaController
  private readonly API_PAGAMENTOS = `${environment.apiUrl}/pagamentos-nota`;

  // --- Métodos de Nota ---

  salvar(payload: SalvarNotaRequest): Observable<any> {
    return this.http.post<any>(this.API_NOTAS, payload);
  }

  listarTodas(): Observable<any[]> {
    return this.http.get<any[]>(this.API_NOTAS);
  }

 
  registrarPagamento(payload: PagamentoNotaRequest): Observable<any> {
    return this.http.post<any>(this.API_PAGAMENTOS, payload);
  }

  buscarHistoricoPagamentos(notaId: number): Observable<any[]> {
    // Trocamos this.API por this.API_NOTAS
    return this.http.get<any[]>(`${this.API_NOTAS}/${notaId}/historico-pagamentos`);
  }

 buscarHistoricoFiltrado(ano: number, inicio?: string, fim?: string): Observable<HistoricoNotaResponse[]> {
    let params = new HttpParams().set('ano', ano.toString()); // 👉 Adiciona o ano na URL
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);

    return this.http.get<HistoricoNotaResponse[]>(`${this.API_NOTAS}/historico`, { params });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_NOTAS}/${id}`);
  }

  editar(id: number, nota: SalvarNotaRequest): Observable<any> {
    return this.http.put(`${this.API_NOTAS}/${id}`, nota);
  }
}