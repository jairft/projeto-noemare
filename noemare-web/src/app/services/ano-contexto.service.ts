import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnoContextoService {
  // 1. Defina o ano de "nascimento" do seu sistema
  private readonly ANO_INICIAL = 2026;

  // 2. O BehaviorSubject guarda o ano selecionado e avisa quem estiver "ouvindo"
  private anoSelecionadoSubject = new BehaviorSubject<number>(new Date().getFullYear());
  anoSelecionado$ = this.anoSelecionadoSubject.asObservable();

  constructor() { }

  // 👉 A PROPRIEDADE QUE ESTAVA FALTANDO:
  // Ela gera a lista de 2024 até o ano atual + 2 automaticamente
  get anosDisponiveis(): number[] {
    const anoAtual = new Date().getFullYear();
    const anos: number[] = [];

    for (let i = this.ANO_INICIAL; i <= (anoAtual + 2); i++) {
      anos.push(i);
    }
    
    // Retorna a lista (opcional: .reverse() se quiser o ano mais novo no topo)
    return anos.reverse();
  }

  // Método para mudar o ano globalmente
  setAno(ano: number): void {
    this.anoSelecionadoSubject.next(ano);
  }

  // Método auxiliar para pegar o valor atual sem precisar de Observable
  getAnoAtual(): number {
    return this.anoSelecionadoSubject.value;
  }
}