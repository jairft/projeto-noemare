import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FuncionarioService {
  private readonly http = inject(HttpClient);
  
  // URL base apontando para o controller de funcionários no Spring Boot
  private readonly API = `${environment.apiUrl}/funcionarios`;

  listarTodos(): Observable<any[]> {
    return this.http.get<any[]>(this.API);
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.API}/${id}`);
  }

  salvar(funcionario: any): Observable<any> {
    return this.http.post<any>(this.API, funcionario);
  }

  ativarConta(id: number, senhaAdmin: string): Observable<any> {
    return this.http.put<any>(`${this.API}/${id}/ativar`, { senha: senhaAdmin });
  }

  excluirComSenha(id: number, senhaAdmin: string): Observable<any> {
    return this.http.post<any>(`${this.API}/${id}/excluir`, { senha: senhaAdmin });
  }

  redefinirSenha(id: number, dados: any): Observable<any> {
    return this.http.post<any>(`${this.API}/${id}/redefinir-senha`, dados);
  }

  /**
   * NOVO MÉTODO: Troca de senha pelo próprio usuário logado
   * @param dados Objeto contendo { senhaAtual, novaSenha }
   */
  alterarSenhaPropria(dados: any): Observable<any> {
    // Usamos PUT pois é uma atualização de dados do perfil
    return this.http.put<any>(`${this.API}/alterar-senha`, dados);
  }
}