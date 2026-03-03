import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { forkJoin, finalize } from 'rxjs';

import { FornecedorService } from '../../../services/fornecedor.service';
import { NotifyService } from '../../../services/notify.service';
import { EmprestimoService } from '../../../services/emprestimo.service';
import { HistoricoGeral } from '../../../models/fornecedor.model';
import { EmprestimoResponse } from '../../../models/emprestimo.model';

@Component({
  selector: 'app-historico-mobile',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatButtonModule,
    MatProgressSpinnerModule,
    MatBottomSheetModule,
    MatExpansionModule,
    MatTabsModule
  ],
  templateUrl: './historico-mobile.component.html',
  styleUrl: './historico-mobile.component.scss'
})
export class HistoricoMobileComponent implements OnInit {
  private readonly fornecedorService = inject(FornecedorService);
  private readonly emprestimoService = inject(EmprestimoService);
  private readonly notify = inject(NotifyService);
  private readonly bottomSheetRef = inject(MatBottomSheetRef<HistoricoMobileComponent>);

  // Dados de Notas
  resumo: HistoricoGeral | null = null;
  
  // Dados de Investimentos
  investimentos: EmprestimoResponse[] = [];
  totalInvestido: number = 0;
  totalSaldoRestante: number = 0;

  carregando = true;

  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { id: number, nome: string }) {}

  ngOnInit(): void {
    // Busca em paralelo como na versão Web
    forkJoin({
      notas: this.fornecedorService.obterHistoricoGeral(this.data.id),
      invest: this.emprestimoService.listarHistoricoInvestimentos(this.data.id)
    })
    .pipe(finalize(() => this.carregando = false))
    .subscribe({
      next: (res) => {
        // Mapeia Resumo de Notas
        this.resumo = {
          ...res.notas,
          itensAgrupados: res.notas.itensAgrupados || [],
          notas: res.notas.notas || []
        };

        // Mapeia Investimentos
        this.investimentos = res.invest.map(inv => ({
          ...inv,
          pagamentos: inv.pagamentos || []
        }));

        this.calcularKpisInvestimentos();
      },
      error: () => {
        this.notify.erro('Erro ao carregar o histórico do fornecedor.');
        this.fechar();
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
        a.download = `extrato-investimentos-${this.data.nome.toLowerCase()}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notify.erro('Erro ao gerar o PDF de investimentos.')
    });
  }

  fechar(event?: MouseEvent): void {
    if (event) { event.preventDefault(); }
    this.bottomSheetRef.dismiss();
  }

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