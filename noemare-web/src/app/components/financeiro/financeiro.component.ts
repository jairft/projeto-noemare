import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs'; 
import { SelectionModel } from '@angular/cdk/collections'; 
import { FormsModule } from '@angular/forms'; 

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox'; 
import { MatSelectModule } from '@angular/material/select'; 
import { MatFormFieldModule } from '@angular/material/form-field'; 

// Services, Models e Componentes
import { NotaFornecedorService } from '../../services/nota-fornecedor.service';
import { BaixaPagamentoComponent } from './baixa-pagamento.component/baixa-pagamento.component';
import { HistoricoPagamentoComponent } from './historico-pagamento.component/historico-pagamento.component';
import { NotifyService } from '../../services/notify.service'; 

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, 
    MatButtonModule, MatIconModule, MatCardModule, 
    MatChipsModule, MatTooltipModule, MatDialogModule, 
    MatPaginatorModule, MatCheckboxModule,
    FormsModule, MatSelectModule, MatFormFieldModule
  ],
  templateUrl: './financeiro.component.html',
  styleUrl: './financeiro.component.scss'
})
export class FinanceiroComponent implements OnInit {
  
  private readonly notaService = inject(NotaFornecedorService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService); 
  private readonly router = inject(Router);

  isLoading: boolean = true; // 👉 Começa carregando

  todasAsContasOriginais: any[] = []; 
  fornecedoresFiltro: { id: number, nome: string }[] = [];
  fornecedorSelecionado: number | string = '';

  contasAPagar: any[] = [];
  pageSize = 5;
  pageIndex = 0;

  valorTotalComprado: number = 0;
  valorTotalPago: number = 0;
  valorTotalPendente: number = 0;

  selecao = new SelectionModel<any>(true, []);

  ngOnInit(): void {
    this.carregarContasPendentes();
  }

  carregarContasPendentes(): void {
    this.isLoading = true; // 👉 Liga o loading
    
    this.notaService.listarTodas().subscribe({
      next: (notas) => {
        const todasAsNotas = notas.map(nota => {
          const valorJaPago = nota.valorPago || 0; 
          const faltaPagar = nota.valorTotal - valorJaPago;
          const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
          
          return {
            id: nota.id,
            numeroNota: nota.numeroNota || 'S/N', 
            fornecedor: nota.fornecedorNome,
            fornecedorId: nota.fornecedorId,
            data: nota.dataNota ? new Date(nota.dataNota).toLocaleDateString('pt-BR') : '-',
            valorTotalFormatado: formatadorMoeda.format(nota.valorTotal),
            valorTotal: nota.valorTotal, 
            valorPagoNum: valorJaPago,   
            valorPago: formatadorMoeda.format(valorJaPago),
            faltaPagarNumero: faltaPagar, 
            faltaPagar: formatadorMoeda.format(faltaPagar),
            status: nota.status,
            notaOriginal: nota
          };
        });

        const pesos: { [key: string]: number } = { 'ABERTA': 1, 'PARCIAL': 2, 'PAGA': 3 };

        this.todasAsContasOriginais = todasAsNotas.sort((a, b) => {
          return (pesos[a.status] || 99) - (pesos[b.status] || 99);
        });

        this.extrairFornecedoresParaFiltro();
        this.aplicarFiltroFornecedor(); 
        
        this.isLoading = false; // 👉 Desliga o loading no sucesso
      },
      error: (err) => {
        console.error(err);
        this.notify.erro('Não foi possível carregar as contas do financeiro.'); 
        this.isLoading = false; // 👉 Desliga o loading no erro
      }
    });
  }

  // 👉 Calcula os valores dos Cards (Sempre usa os números crus)
  atualizarKpisFinanceiros(): void {
    this.valorTotalComprado = 0;
    this.valorTotalPago = 0;
    this.valorTotalPendente = 0;

    // A soma deve ser feita baseada na lista filtrada exibida na tela
    this.contasAPagar.forEach(conta => {
      this.valorTotalComprado += Number(conta.valorTotal) || 0; 
      this.valorTotalPago += Number(conta.valorPagoNum) || 0;
      this.valorTotalPendente += Number(conta.faltaPagarNumero) || 0;
    });
  }

  extrairFornecedoresParaFiltro(): void {
    const map = new Map<number, string>();
    this.todasAsContasOriginais.forEach(c => {
      if (!map.has(c.fornecedorId)) {
        map.set(c.fornecedorId, c.fornecedor);
      }
    });
    this.fornecedoresFiltro = Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }

  aplicarFiltroFornecedor(): void {
    if (this.fornecedorSelecionado) {
      this.contasAPagar = this.todasAsContasOriginais.filter(c => c.fornecedorId === this.fornecedorSelecionado);
    } else {
      this.contasAPagar = [...this.todasAsContasOriginais];
    }
    
    this.pageIndex = 0;
    this.selecao.clear();
    
    this.atualizarKpisFinanceiros(); 
  }

  toggleSelecao(conta: any): void {
    if (this.selecao.selected.length > 0) {
      const idFornecedorSelecionado = this.selecao.selected[0].fornecedorId;
      if (conta.fornecedorId !== idFornecedorSelecionado && !this.selecao.isSelected(conta)) {
        this.notify.info('Você só pode selecionar notas de um mesmo fornecedor para o lote.');
        return;
      }
    }
    this.selecao.toggle(conta);
  }

  get valorTotalSelecionado(): number {
    return this.selecao.selected.reduce((acc, c) => acc + c.faltaPagarNumero, 0);
  }

  abrirBaixaPagamento(conta: any): void {
    const dialogRef = this.dialog.open(BaixaPagamentoComponent, {
      width: '500px',
      data: {
        fornecedor: conta.fornecedor,
        fornecedorId: conta.fornecedorId,
        valorTotal: conta.valorTotalFormatado,
        faltaPagar: conta.faltaPagar,
        faltaPagarNumero: conta.faltaPagarNumero,
        isLote: false
      },
      panelClass: 'custom-modal'
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.processarPagamento(conta.id, res);
    });
  }

  abrirBaixaEmLote(): void {
    const notas = this.selecao.selected;
    const totalAPagar = this.valorTotalSelecionado; 

    const dialogRef = this.dialog.open(BaixaPagamentoComponent, {
      width: '500px',
      data: {
        fornecedor: notas[0].fornecedor,
        fornecedorId: notas[0].fornecedorId,
        valorTotal: `Lote (${notas.length} notas)`,
        faltaPagar: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAPagar),
        faltaPagarNumero: totalAPagar,
        isLote: true 
      },
      panelClass: 'custom-modal'
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const totalInformado = (res.valorPago || 0) + (res.abateInvestimento || 0) + (res.abateAdiantamento || 0);

        if (Math.abs(totalInformado - totalAPagar) > 0.01) {
          this.notify.info(`Para pagamentos em lote, o valor deve ser integral (R$ ${totalAPagar.toFixed(2).replace('.', ',')}). Pagamentos parciais devem ser feitos nota a nota.`);
          return; 
        }

        this.processarPagamentoLote(notas, res);
        this.selecao.clear(); 
      }
    });
  }

  processarPagamento(notaId: number, dadosDialog: any): void {
    const request = {
      notaId: notaId,
      valorPagoDinheiro: dadosDialog.valorPago || 0, 
      valorAbatidoInvestimento: dadosDialog.abateInvestimento || 0,
      valorAbatidoAdiantamento: dadosDialog.abateAdiantamento || 0,
      dataOperacao: dadosDialog.dataPagamento,
      observacao: dadosDialog.observacao
    };
    
    this.notaService.registrarPagamento(request).subscribe({
      next: () => {
        this.notify.sucesso('Pagamento registrado e saldos atualizados!'); 
        this.carregarContasPendentes(); 
      },
      error: (err) => {
        const msg = err.error?.mensagem || 'Erro ao processar o pagamento da nota.';
        this.notify.erro(msg);
      }
    });
  }

  processarPagamentoLote(notas: any[], dadosDialog: any): void {
    let saldoDinheiro = dadosDialog.valorPago || 0;
    let saldoInvestimento = dadosDialog.abateInvestimento || 0;
    let saldoAdiantamento = dadosDialog.abateAdiantamento || 0;

    const requests: any[] = [];

    notas.forEach(nota => {
      const faltaNaNota = nota.faltaPagarNumero;
      let restanteParaQuitarNota = faltaNaNota;

      let pagDinheiro = 0, abateInv = 0, abateAdt = 0;

      if (saldoDinheiro > 0) {
        pagDinheiro = Math.min(saldoDinheiro, restanteParaQuitarNota);
        saldoDinheiro -= pagDinheiro;
        restanteParaQuitarNota -= pagDinheiro;
      }
      if (restanteParaQuitarNota > 0 && saldoInvestimento > 0) {
        abateInv = Math.min(saldoInvestimento, restanteParaQuitarNota);
        saldoInvestimento -= abateInv;
        restanteParaQuitarNota -= abateInv;
      }
      if (restanteParaQuitarNota > 0 && saldoAdiantamento > 0) {
        abateAdt = Math.min(saldoAdiantamento, restanteParaQuitarNota);
        saldoAdiantamento -= abateAdt;
        restanteParaQuitarNota -= abateAdt;
      }

      const totalAbatidoNestaNota = pagDinheiro + abateInv + abateAdt;

      if (totalAbatidoNestaNota > 0) {
        requests.push(
          this.notaService.registrarPagamento({
            notaId: nota.id,
            valorPagoDinheiro: pagDinheiro,
            valorAbatidoInvestimento: abateInv,
            valorAbatidoAdiantamento: abateAdt,
            dataOperacao: dadosDialog.dataPagamento,
            observacao: dadosDialog.observacao ? `[Lote] ${dadosDialog.observacao}` : 'Baixa em Lote'
          })
        );
      }
    });

    if (requests.length === 0) {
      this.notify.info('O valor informado não foi suficiente para abater nenhuma nota.');
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.notify.sucesso(`${requests.length} nota(s) paga(s) com sucesso!`);
        this.carregarContasPendentes();
      },
      error: () => {
        this.notify.erro('Ocorreu um erro ao processar o lote. Verifique os saldos.');
        this.carregarContasPendentes();
      }
    });
  }

  isAllSelected(): boolean {
    const pendentes = this.notasPendentesNaVisualizacao;
    const numSelected = this.selecao.selected.length;
    const numRows = pendentes.length;
    return numSelected === numRows && numRows > 0;
  }

  editarNota(conta: any): void {
    this.router.navigate(['/notas-fornecedor'], { queryParams: { editId: conta.id } });
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selecao.clear();
      return;
    }

    const pendentes = this.notasPendentesNaVisualizacao;

    if (pendentes.length > 0) {
      const primeiroId = pendentes[0].fornecedorId;
      const temVariosFornecedores = pendentes.some(p => p.fornecedorId !== primeiroId);
      
      if (temVariosFornecedores) {
        this.notify.info('Para selecionar todos em lote, filtre por um Fornecedor específico primeiro.');
        return;
      }
    }

    this.selecao.select(...pendentes);
  }

  abrirModalHistorico(conta: any): void {
    this.dialog.open(HistoricoPagamentoComponent, {
      width: '500px',
      data: { notaId: conta.id, fornecedor: conta.fornecedor, valorTotal: conta.valorTotalFormatado },
      panelClass: 'custom-modal'
    });
  }

  get contasPaginadas() {
    const scrollIndex = this.pageIndex * this.pageSize;
    return this.contasAPagar.slice(scrollIndex, scrollIndex + this.pageSize);
  }

  handlePageEvent(e: PageEvent) { this.pageIndex = e.pageIndex; }
  get totalPagas(): number { return this.contasAPagar.filter(c => c.status === 'PAGA').length; }
  get totalPendentes(): number { return this.contasAPagar.filter(c => c.status !== 'PAGA').length; }
  get notasPendentesNaVisualizacao(): any[] {
    return this.contasAPagar.filter(c => c.status !== 'PAGA');
  }
}