import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassificacaoProduto } from '../models/classificacao-produto.model';
import { environment } from '../../environments/environment'; // Ajuste o caminho conforme seu projeto

@Injectable({
  providedIn: 'root'
})
export class ClassificacaoProdutoService {
  private readonly http = inject(HttpClient);
  
  // Ajuste a URL para o endpoint que criamos no Spring Boot
  private readonly API = `${environment.apiUrl}/classificao-produto`;

  listarTodos(): Observable<ClassificacaoProduto[]> {
    return this.http.get<ClassificacaoProduto[]>(this.API);
  }

  cadastrar(produto: Partial<ClassificacaoProduto>): Observable<ClassificacaoProduto> {
    return this.http.post<ClassificacaoProduto>(this.API, produto);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

    atualizar(id: number, dados: any): Observable<any> {
    return this.http.put(`${this.API}/${id}`, dados);
  }
}