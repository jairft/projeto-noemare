import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

// Services e Models
import { NotaFornecedorService } from '../../services/nota-fornecedor.service';
import { HistoricoNotaResponse, HistoricoNotaItemResponse } from '../../models/nota.model';
import { NotifyService } from '../../services/notify.service'; 
import { AnoContextoService } from '../../services/ano-contexto.service';
import { ConfirmService } from '../../services/confirm.service'; // 👉 Injetado

// Componentes de Modal (Apenas para referência de classe)
import { ReciboNotaComponent } from './recibo-nota.component/recibo-nota.component';

@Component({
  selector: 'app-historico-notas',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, 
    MatInputModule, MatDialogModule, MatTooltipModule,
    MatPaginatorModule
    // ✅ Zero Warnings: ConfirmDialogComponent e ReciboNotaComponent removidos daqui
  ],
  templateUrl: './historico-notas.component.html',
  styleUrl: './historico-notas.component.scss'
})
export class HistoricoNotasComponent implements OnInit, AfterViewInit {

  private readonly notaService = inject(NotaFornecedorService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService); 
  private readonly anoContexto = inject(AnoContextoService);
  private readonly confirmService = inject(ConfirmService); // 👉 Injetado

  filtroForm: FormGroup = this.fb.group({
    dataInicio: [null],
    dataFim: [null]
  });

  notas = new MatTableDataSource<HistoricoNotaResponse>([]);
  // Adicione a coluna 'numeroNota' na posição desejada (eu coloquei antes do fornecedor)
  colunasExibidas: string[] = ['numeroNota', 'dataHora', 'fornecedor', 'pescados', 'valorTotal', 'acoes'];
  
  anoAtual!: number;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.anoContexto.anoSelecionado$.subscribe(ano => {
      this.anoAtual = ano;
      this.buscarHistorico(); 
    });
  }

  ngAfterViewInit(): void {
    this.notas.paginator = this.paginator;
  }

  buscarHistorico(): void {
    const { dataInicio, dataFim } = this.filtroForm.value;
    const inicioStr = dataInicio ? this.formatarDataIso(dataInicio) : undefined;
    const fimStr = dataFim ? this.formatarDataIso(dataFim) : undefined;

    this.notaService.buscarHistoricoFiltrado(this.anoAtual, inicioStr, fimStr).subscribe({
      next: (dados) => {
        this.notas.data = dados;
      },
      error: () => this.notify.erro('Não foi possível carregar o histórico.')
    });
  }

  // 👉 ATUALIZADO: Usando o ConfirmService (Sem confirm nativo e sem warnings)
  excluirNota(nota: HistoricoNotaResponse): void {
    const valorFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valorTotal);
    
    // Criamos uma mensagem rica com HTML para o dialog
    const mensagem = `
      Deseja realmente excluir a nota de <b>${nota.fornecedorNome}</b>?<br>
      <b>Valor:</b> ${valorFormatado}<br>
      <b>Itens:</b> <small>${this.resumirItens(nota.itens)}</small>
    `;

    this.confirmService.perigo('Excluir Nota de Fornecimento', mensagem)
      .subscribe((confirmado: boolean) => {
        if (confirmado) {
          this.notaService.excluir(nota.id).subscribe({
            next: () => {
              this.notify.sucesso('Nota excluída com sucesso!');
              this.buscarHistorico(); 
            },
            error: (err: HttpErrorResponse) => {
              const msg = err.error?.message || err.error?.mensagem || 'Erro ao tentar excluir a nota.';
              this.notify.erro(msg);
            }
          });
        }
      });
  }

  limparFiltro(): void {
    this.filtroForm.reset();
    this.buscarHistorico();
    this.notify.info('Filtros de data removidos.'); 
  }

  abrirModalRecibo(nota: HistoricoNotaResponse): void {
    this.dialog.open(ReciboNotaComponent, {
      width: '500px',
      data: nota,
      panelClass: 'custom-dialog-container'
    });
  }

  resumirItens(itens: HistoricoNotaItemResponse[]): string {
    if (!itens || itens.length === 0) return 'Sem itens';
    return itens.map(i => `${i.produtoNome} ${i.tipo} (${i.quantidadeKg}kg)`).join(', ');
  }

  aplicarFiltro(event: Event): void {
    const valorFiltro = (event.target as HTMLInputElement).value;
    this.notas.filter = valorFiltro.trim().toLowerCase();
    if (this.notas.paginator) {
      this.notas.paginator.firstPage();
    }
  }

  private formatarDataIso(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}