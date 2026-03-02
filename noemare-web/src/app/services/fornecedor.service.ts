import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Fornecedor, HistoricoGeral, StatusFornecedor } from '../models/fornecedor.model';
import { SalvarNotaRequest } from '../models/nota.model';

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private readonly http = inject(HttpClient);
  
  // Garanta que a URL termine conforme seu @RequestMapping no Java
  private readonly API = `${environment.apiUrl}/fornecedores`;

  listarTodos(): Observable<Fornecedor[]> {
    return this.http.get<Fornecedor[]>(this.API);
  }

  // Novo método para buscar por ID
  buscarPorId(id: number): Observable<Fornecedor> {
    return this.http.get<Fornecedor>(`${this.API}/${id}`);
  }

  salvar(fornecedor: Partial<Fornecedor>): Observable<Fornecedor> {
    return this.http.post<Fornecedor>(this.API, fornecedor);
  }

  // AJUSTE: O caminho agora é /{id}/nome conforme seu @PatchMapping
  atualizarNome(id: number, nome: string): Observable<Fornecedor> {
    return this.http.patch<Fornecedor>(`${this.API}/${id}/nome`, nome);
  }

  // NOVO: Método para alterar o status usando @RequestParam
  alterarStatus(id: number, status: StatusFornecedor): Observable<void> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<void>(`${this.API}/${id}/status`, null, { params });
  }

  salvarNotas(payload: SalvarNotaRequest): Observable<any> {
    // Repare que a URL aqui deve apontar para o controller de notas no Spring Boot
    const urlNotas = `${environment.apiUrl}/notas-fornecedor`;
    return this.http.post<any>(urlNotas, payload);
  }

  buscarSaldosDevedores(id: number): Observable<{ saldoInvestimento: number, saldoAdiantamento: number }> {
    return this.http.get<{ saldoInvestimento: number, saldoAdiantamento: number }>(`${this.API}/${id}/saldos`);
  }

  obterHistoricoGeral(id: number): Observable<HistoricoGeral> {
    return this.http.get<HistoricoGeral>(`${this.API}/${id}/historico-geral`);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  gerarRelatorioPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.API}/${id}/relatorio-pdf`, { responseType: 'blob' });
  }
}