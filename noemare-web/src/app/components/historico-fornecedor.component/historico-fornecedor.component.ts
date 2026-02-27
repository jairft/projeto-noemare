import { Component, OnInit, inject } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardFornecedorResponse } from '../../models/dashboard.model';
import { NotifyService } from '../../services/notify.service';
import { RouterModule } from '@angular/router';
import { AnoContextoService } from '../../services/ano-contexto.service';

@Component({
  selector: 'app-historico-fornecedor',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule, RouterModule, MatPaginatorModule],
  templateUrl: './historico-fornecedor.component.html',
  styleUrls: ['./historico-fornecedor.component.scss']
})
export class HistoricoFornecedorComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly notify = inject(NotifyService);
  private readonly anoContexto = inject(AnoContextoService);

  dados?: DashboardFornecedorResponse;
  isLoading = true;
  anoAtivo!: number;

  fornecedoresFiltrados: any[] = [];
  fornecedoresPaginados: any[] = [];
  termoBusca: string = '';

  pageSize: number = 6;
  pageIndex: number = 0;
  totalItems: number = 0;

  ngOnInit(): void {
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoAtivo = ano;
      this.carregarDados(ano);
    });
  }

  carregarDados(ano: number): void {
    this.isLoading = true;
    this.dashboardService.obterRelatorioFornecedores(ano).subscribe({
      next: (res: DashboardFornecedorResponse) => {
        this.dados = res;
        
        if (res.fornecedores) {
          // 👉 APLICA A ORDENAÇÃO POR PRIORIDADE LOGO NA CHEGADA DOS DADOS
          this.fornecedoresFiltrados = this.ordenarPorStatus(res.fornecedores);
          this.totalItems = this.fornecedoresFiltrados.length;
          this.atualizarPaginacao();
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.notify.erro('Erro ao carregar o extrato dos fornecedores.');
        this.isLoading = false;
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
   * 💡 LÓGICA DE ORDENAÇÃO POR PRIORIDADE
   * Grupo 1: Pendentes (Saldo Líquido != 0)
   * Grupo 2: Quitados com Produção (Venderam algo na safra)
   * Grupo 3: Quitados sem nada (Zerados)
   */
  private ordenarPorStatus(lista: any[]): any[] {
    return [...lista].sort((a, b) => {
      const pA = this.getNivelPrioridade(a);
      const pB = this.getNivelPrioridade(b);

      if (pA !== pB) {
        return pA - pB;
      }
      
      // Desempate alfabético por nome do fornecedor
      return a.nomeFornecedor.localeCompare(b.nomeFornecedor);
    });
  }

  private getNivelPrioridade(f: any): number {
    // 1. Prioridade máxima: valores pendentes (A Pagar ou A Receber)
    if (f.saldoLiquido !== 0) return 1; 
    
    // 2. Prioridade média: Quitado, mas com movimentação de produção na safra
    if (f.producao && f.producao.length > 0) return 2; 
    
    // 3. Prioridade mínima: Totalmente zerado e sem produção
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

  obterValorAbsoluto(valor: number): number {
    return Math.abs(valor);
  }
}