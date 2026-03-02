import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion'; 
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin, finalize } from 'rxjs'; // 👉 Adicionado para requisições em paralelo

import { HistoricoGeral } from '../../../models/fornecedor.model';
import { FornecedorService } from '../../../services/fornecedor.service';
import { NotifyService } from '../../../services/notify.service';
import { EmprestimoService } from '../../../services/emprestimo.service'; // 👉 Importado
import { EmprestimoResponse } from '../../../models/emprestimo.model';     // 👉 Importado

@Component({
  selector: 'app-historico-geral',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatIconModule, 
    MatButtonModule, 
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule // Necessário para os botões de PDF
  ],
  templateUrl: './historico-geral.component.html',
  styleUrl: './historico-geral.component.scss'
})
export class HistoricoGeralComponent implements OnInit {
  private readonly fornecedorService = inject(FornecedorService);
  private readonly emprestimoService = inject(EmprestimoService); // 👉 Injetado
  private readonly notify = inject(NotifyService);
  private readonly dialogRef = inject(MatDialogRef<HistoricoGeralComponent>);

  // Variáveis para Notas
  resumo: HistoricoGeral | null = null; 
  
  // Variáveis para Investimentos
  investimentos: EmprestimoResponse[] = [];
  totalInvestido: number = 0;
  totalSaldoRestante: number = 0;

  carregando = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { id: number, nome: string }) {}

  ngOnInit(): void {
    // 👉 forkJoin executa ambas as buscas ao mesmo tempo
    forkJoin({
      notas: this.fornecedorService.obterHistoricoGeral(this.data.id),
      invest: this.emprestimoService.listarHistoricoInvestimentos(this.data.id)
    })
    .pipe(finalize(() => this.carregando = false))
    .subscribe({
      next: (res) => {
        // Popula as notas
        this.resumo = {
          ...res.notas,
          itensAgrupados: res.notas.itensAgrupados || [],
          notas: res.notas.notas || []
        };

        // Popula os investimentos
        this.investimentos = res.invest.map(inv => ({
          ...inv,
          pagamentos: inv.pagamentos || []
        }));

        this.calcularKpisInvestimentos();
      },
      error: () => {
        this.notify.erro('Erro ao carregar o histórico do fornecedor.');
        this.dialogRef.close();
      }
    });
  }

  calcularKpisInvestimentos() {
    this.totalInvestido = this.investimentos.reduce((acc, curr) => acc + curr.valorTotal, 0);
    this.totalSaldoRestante = this.investimentos.reduce((acc, curr) => acc + curr.saldoRestante, 0);
  }

  gerarPdfNotas() {
    this.fornecedorService.gerarRelatorioPdf(this.data.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `extrato-notas-${this.data.nome.toLowerCase()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notify.erro('Erro ao gerar o PDF de notas.')
    });
  }

  gerarPdfInvestimentos() {
    this.emprestimoService.gerarRelatorioPdfInvestimentos(this.data.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Nome customizado para o arquivo de investimentos
        a.download = `extrato-investimentos-${this.data.nome.toLowerCase()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notify.erro('Erro ao gerar o PDF de investimentos.')
    });
  }

  fechar() { this.dialogRef.close(); }

  getCorStatus(status: string): string {
    switch (status) {
      case 'PAGA': 
      case 'QUITADO': return 'status-paga';
      case 'PARCIAL': return 'status-parcial';
      case 'ABERTA': 
      case 'ABERTO': return 'status-aberta';
      default: return 'status-default';
    }
  }
}