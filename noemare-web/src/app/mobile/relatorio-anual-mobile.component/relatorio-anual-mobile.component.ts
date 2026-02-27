import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { RelatorioService } from '../../services/relatorio.service';
import { AnoContextoService } from '../../services/ano-contexto.service';

@Component({
  selector: 'app-relatorio-anual-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './relatorio-anual-mobile.component.html',
  styleUrl: './relatorio-anual-mobile.component.scss'
})
export class RelatorioAnualMobileComponent implements OnInit {
  private location = inject(Location);
  private relatorioService = inject(RelatorioService);
  private anoContexto = inject(AnoContextoService);

  // 👉 Variável central que recebe tudo da API, igualzinho ao Desktop
  dados: any = null; 
  anoSelecionado!: number;
  abaAtiva: 'fornecedores' | 'pescados' = 'fornecedores';

  ngOnInit(): void {
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoSelecionado = ano;
      this.carregarDados();
    });
  }

  carregarDados(): void {
    this.relatorioService.obterResumoAnual().subscribe({
      next: (res) => {
        this.dados = res; 
      },
      error: (err) => console.error('Erro ao carregar relatório:', err)
    });
  }

  setAba(aba: 'fornecedores' | 'pescados') {
    this.abaAtiva = aba;
  }

  voltar(): void {
    this.location.back();
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }
}