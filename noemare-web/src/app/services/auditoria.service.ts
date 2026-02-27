import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LogLancamento } from '../models/log.model'; // Verifique se o caminho do model está correto

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  
  // Apontando para o endpoint de logs que você acabou de criar no Spring Boot
  private readonly API = `${environment.apiUrl}/logs`;

  /**
   * Busca todo o histórico de auditoria (logs) do sistema.
   */
  listarTodos(): Observable<LogLancamento[]> {
    return this.http.get<LogLancamento[]>(this.API);
  }
}