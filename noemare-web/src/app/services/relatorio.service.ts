import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/relatorios`;

  obterResumoAnual(): Observable<any> {
    return this.http.get<any>(`${this.API}/resumo-anual`);
  }
}