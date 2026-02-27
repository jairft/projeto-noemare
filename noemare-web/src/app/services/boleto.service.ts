import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BoletoService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/boletos`;

  cadastrar(boleto: any): Observable<any> {
    return this.http.post<any>(this.API, boleto);
  }

  listarTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.API);
  }

  buscarAlertas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/alertas`);
  }

    deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
  darBaixa(id: number): Observable<void> {
      return this.http.patch<void>(`${this.API}/${id}/pagar`, {});
    }
   // Adicione o parâmetro 'ano' aqui
  buscarNotificacoes(ano?: number): Observable<any[]> {
    // Se o ano for passado, adiciona na URL, senão chama a rota padrão
    const url = ano ? `${this.API}/notificacoes?ano=${ano}` : `${this.API}/notificacoes`;
    return this.http.get<any[]>(url);
  }
}