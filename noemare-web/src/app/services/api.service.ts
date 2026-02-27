import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Pega o IP ou domínio que está no navegador (ex: 192.168.1.15 ou localhost)
  private readonly host = window.location.hostname;
  
  // Monta a URL da API apontando para a porta 8080 do Spring
  private readonly API_URL = `http://${this.host}:8080/api`;

  constructor() {
    console.log('Conectando na API em:', this.API_URL);
  }

  // Seus métodos de GET, POST, etc, usam o this.API_URL
}