import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


export interface ConfiguracaoSistema {
  id?: number;
  diasRetencaoLogs: number;
  horarioLimpezaLogs: string; // Ex: '03:00:00'
}

@Injectable({
  providedIn: 'root'
})
export class ConfiguracaoService {

  private http = inject(HttpClient);
  // Confirme se a sua variável de ambiente chama apiUrl mesmo
  private apiUrl = `${environment.apiUrl}/configuracoes`; 

  obterConfiguracao(): Observable<ConfiguracaoSistema> {
    return this.http.get<ConfiguracaoSistema>(this.apiUrl);
  }

  atualizarConfiguracao(dados: ConfiguracaoSistema): Observable<ConfiguracaoSistema> {
    return this.http.put<ConfiguracaoSistema>(this.apiUrl, dados);
  }
}