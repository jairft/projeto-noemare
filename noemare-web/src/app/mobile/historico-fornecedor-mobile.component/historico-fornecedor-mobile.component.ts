import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Router, RouterModule } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardFornecedorResponse } from '../../models/dashboard.model';
import { AnoContextoService } from '../../services/ano-contexto.service'; // 👉 Importado para fix de safra

@Component({
  selector: 'app-historico-fornecedor-mobile',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatExpansionModule, RouterModule, MatPaginatorModule],
  templateUrl: './historico-fornecedor-mobile.component.html',
  styleUrls: ['./historico-fornecedor-mobile.component.scss']
})
export class HistoricoFornecedorMobileComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly anoContexto = inject(AnoContextoService); // 👉 Injetado para sincronia do ano

  dados?: DashboardFornecedorResponse;
  isLoading = true;
  anoAtivo!: number; // 👉 Armazena o ano em exercício

  fornecedoresFiltrados: any[] = [];
  fornecedoresPaginados: any[] = [];
  termoBusca: string = '';

  pageSize: number = 6;
  pageIndex: number = 0;
  totalItems: number = 0;

  ngOnInit(): void {
    // 👉 Monitora o ano selecionado e recarrega automaticamente
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoAtivo = ano;
      this.carregarDados(ano);
    });
  }

  carregarDados(ano: number): void {
    this.isLoading = true;
    this.dashboardService.obterRelatorioFornecedores(ano).subscribe({
      next: (res) => {
        this.dados = res;
        
        if (res.fornecedores) {
          // 👉 APLICA A ORDENAÇÃO POR PRIORIDADE
          this.fornecedoresFiltrados = this.ordenarPorStatus(res.fornecedores);
          this.totalItems = this.fornecedoresFiltrados.length;
          this.atualizarPaginacao();
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erro ao buscar extrato de fornecedores.');
      }
    });
  }

  aplicarFiltro(event: Event): void {
    const valor = (event.target as HTMLInputElement).value.toLowerCase();
    this.termoBusca = valor;

    if (!this.dados || !this.dados.fornecedores) return;

    const listaBase = valor 
      ? this.dados.fornecedores.filter((f: any) => f.nomeFornecedor.toLowerCase().includes(valor))
      : this.dados.fornecedores;

    // 👉 RE-ORDENA A LISTA FILTRADA ANTES DE PAGINAR
    this.fornecedoresFiltrados = this.ordenarPorStatus(listaBase);

    this.pageIndex = 0; 
    this.totalItems = this.fornecedoresFiltrados.length;
    this.atualizarPaginacao();
  }

  /**
   * 💡 LÓGICA DE ORDENAÇÃO POR PRIORIDADE (MOBILE)
   * 1. Pendentes (Saldo Líquido != 0)
   * 2. Quitados com Produção (Movimentação na safra)
   * 3. Quitados sem nada (Zerados)
   */
  private ordenarPorStatus(lista: any[]): any[] {
    return [...lista].sort((a, b) => {
      const pA = this.getNivelPrioridade(a);
      const pB = this.getNivelPrioridade(b);

      if (pA !== pB) {
        return pA - pB;
      }
      
      return a.nomeFornecedor.localeCompare(b.nomeFornecedor);
    });
  }

  private getNivelPrioridade(f: any): number {
    if (f.saldoLiquido !== 0) return 1; 
    if (f.producao && f.producao.length > 0) return 2; 
    return 3; 
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.atualizarPaginacao();
  }

  atualizarPaginacao(): void {
    const inicio = this.pageIndex * this.pageSize;
    const fim = inicio + this.pageSize;
    this.fornecedoresPaginados = this.fornecedoresFiltrados.slice(inicio, fim);
  }

  voltarHome(): void {
    this.router.navigate(['/home-mobile']);
  }
}