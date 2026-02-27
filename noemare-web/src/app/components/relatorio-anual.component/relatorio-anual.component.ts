import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

import { RelatorioService } from '../../services/relatorio.service';
import { AnoContextoService } from '../../services/ano-contexto.service';

@Component({
  selector: 'app-relatorio-anual',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatButtonModule, RouterModule],
  templateUrl: './relatorio-anual.component.html',
  styleUrl: './relatorio-anual.component.scss'
})
export class RelatorioAnualComponent implements OnInit {
  private readonly relatorioService = inject(RelatorioService);
  private readonly anoContexto = inject(AnoContextoService);

  // 👉 Agora 'dados' conterá os campos totalKgGeral e a lista de itens
  dados: any = null;
  anoAtivo!: number;

  // 👉 NOVO: Adicionado 'investimento' na lista de colunas para renderizar na tabela
  colunas: string[] = ['nome', 'comprado', 'pago', 'pendente', 'devedor', 'investimento'];

  colunasItens: string[] = ['produto', 'quantidadeKg', 'precoUnitario', 'valorTotal'];

  ngOnInit() {
    // Monitora o ano selecionado e recarrega os dados automaticamente
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoAtivo = ano;
      this.carregarDados();
    });
  }

  carregarDados() {
    this.relatorioService.obterResumoAnual().subscribe({
      next: (res) => {
        // Armazena a resposta que agora inclui totais financeiros, volumes e lista de produtos
        this.dados = res;
      },
      error: (err) => console.error('Erro ao buscar relatório anual:', err)
    });
  }

  imprimir() {
    window.print();
  }
}