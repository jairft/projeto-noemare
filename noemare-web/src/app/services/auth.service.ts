import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginResponse, RegistroRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  // Método para o Login
  login(credentials: { email: string; senha: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API}/auth/login`, credentials);
  }

  // Envia os dados para o endpoint Java
  registrar(dados: RegistroRequest): Observable<any> {
    return this.http.post(`${this.API}/funcionarios/registrar`, dados);
  }

  // Retorna o token para o interceptor
  get token() {
    return localStorage.getItem('token');
  }

  // --- CORRIGIDO: Agora aponta para /auth/esqueci-senha ---
  solicitarRecuperacaoSenha(email: string): Observable<any> {
    return this.http.post<any>(`${this.API}/auth/esqueci-senha`, { email });
  }

  logout(): void {
    localStorage.removeItem('token');
    // Se você salvar o nome do usuário ou perfil, limpe aqui também:
    // localStorage.removeItem('user');
  }

    limparDados(): void {
      this.logout(); // Apenas chama o logout que já existe
    }
}