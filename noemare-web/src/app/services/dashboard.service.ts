import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // 👉 Importado HttpParams
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DashboardFornecedorResponse } from '../models/dashboard.model';

export interface DashboardResumo {
  totalAPagar: number;
  totalAdiantado: number;
  totalPagoMes: number;
  notasPendentes: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  // 👉 Certifique-se que o caminho condiz com o Controller Java (/api/dashboard)
  private readonly API = `${environment.apiUrl}/dashboard`; 

  // 👉 ATUALIZADO: Agora aceita o 'ano' opcionalmente
  obterResumo(ano?: number): Observable<DashboardResumo> {
    let params = new HttpParams();
    
    // Se o ano for informado, adicionamos como parâmetro na URL (?ano=2026)
    if (ano) {
      params = params.set('ano', ano.toString());
    }

    return this.http.get<DashboardResumo>(`${this.API}/resumo`, { params });
  }

    obterRelatorioFornecedores(ano?: number): Observable<DashboardFornecedorResponse> {
    return this.http.get<DashboardFornecedorResponse>(`${this.API}/relatorio-fornecedores`, {
      params: ano ? { ano: ano.toString() } : {}
    });
  }
}