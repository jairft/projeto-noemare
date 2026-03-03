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

  isLoading: boolean = true; // 👉 Novo controle de loading

  dados: any = null;
  anoAtivo!: number;

  colunas: string[] = ['nome', 'comprado', 'pago', 'pendente', 'devedor', 'investimento'];
  colunasItens: string[] = ['produto', 'quantidadeKg', 'precoUnitario', 'valorTotal'];

  ngOnInit() {
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoAtivo = ano;
      this.carregarDados();
    });
  }

  carregarDados() {
    this.isLoading = true; // 👉 Liga o loading
    this.dados = null;     // Limpa os dados antigos para evitar flashes

    this.relatorioService.obterResumoAnual().subscribe({
      next: (res) => {
        this.dados = res;
        this.isLoading = false; // 👉 Desliga o loading
      },
      error: (err) => {
        console.error('Erro ao buscar relatório anual:', err);
        this.isLoading = false; // 👉 Desliga no erro também
      }
    });
  }

  // 👉 NOVO: Lógica que verifica se a safra teve alguma movimentação
  get isRelatorioVazio(): boolean {
    if (!this.dados) return true;
    
    // Se não retornou nenhum fornecedor com movimentação, consideramos o relatório vazio
    const semFornecedores = !this.dados.fornecedores || this.dados.fornecedores.length === 0;
    const semVolume = !this.dados.totalKgGeral && !this.dados.totalCompradoGeral;
    
    return semFornecedores && semVolume;
  }

  imprimir() {
    window.print();
  }
}