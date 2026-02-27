import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// Material Imports
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule, MatTableDataSource } from '@angular/material/table'; // 👉 Adicionado DataSource
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; // 👉 Paginação
import { MatInputModule } from '@angular/material/input'; // 👉 Busca
import { MatFormFieldModule } from '@angular/material/form-field';

// Services e Models
import { Fornecedor, StatusFornecedor } from '../../models/fornecedor.model';
import { FornecedorService } from '../../services/fornecedor.service';
import { NotifyService } from '../../services/notify.service';

import { ConfirmDialogComponent } from '../confirm-dialogo/confirm-dialog.component';
import { FornecedorFormDialogComponent } from './fornecedor-form-dialog/fornecedor-form-dialog.component';
import { HistoricoGeralComponent } from './historico-geral.component/historico-geral.component';

@Component({
  selector: 'app-fornecedores',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule, 
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    RouterModule,
    MatPaginatorModule, // 👉 Novo
    MatInputModule,     // 👉 Novo
    MatFormFieldModule  // 👉 Novo
  ],
  templateUrl: './fornecedor.component.html', 
  styleUrl: './fornecedor.component.scss'
})
export class FornecedorComponent implements OnInit {

  private readonly service = inject(FornecedorService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotifyService);

  // 👉 Mudança para MatTableDataSource para suportar busca e paginação
  dataSource = new MatTableDataSource<Fornecedor>([]);
  fornecedores: Fornecedor[] = []; // Mantemos o array para os cards de resumo

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  colunasExibidas: string[] = [
    'nome', 
    'saldoDevedorInvestimento', 
    'saldoDevedorAdiantamento', 
    'saldoCredor', 
    'dataCadastro', 
    'analytics', 
    'status', 
    'acoes'
  ];

  ngOnInit(): void {
    this.carregarFornecedores();
  }

  carregarFornecedores(): void {
    this.service.listarTodos().subscribe({
      next: (dados: Fornecedor[]) => { 
        this.fornecedores = dados;
        this.dataSource.data = dados;
        this.dataSource.paginator = this.paginator; // Vincula o paginator
      },
      error: (err: HttpErrorResponse) => {
        this.notify.erro('Erro ao carregar dados do servidor');
      }
    });
  }

  // 👉 NOVO: Lógica de Filtro
  aplicarFiltro(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Métodos de ação (excluir, editar, etc) permanecem iguais, 
  // apenas certifique-se de chamar carregarFornecedores() ao final.

  excluirFornecedor(fornecedor: Fornecedor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir Fornecedor',
        mensagem: `Deseja realmente excluir o fornecedor <b>${fornecedor.nome}</b>?<br><small>Esta ação não pode ser desfeita.</small>`,
        tipo: 'perigo',
        icone: 'person_remove',
        textoConfirmar: 'Excluir Permanentemente'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.service.excluir(fornecedor.id).subscribe({
          next: () => {
            this.notify.sucesso('Fornecedor removido!');
            this.carregarFornecedores();
          },
          error: (err) => this.notify.erro(err.error?.mensagem || 'Erro ao excluir.')
        });
      }
    });
  }

  editarFornecedor(fornecedor: Fornecedor): void {
    this.dialog.open(FornecedorFormDialogComponent, {
      width: '450px',
      data: { ...fornecedor }
    }).afterClosed().subscribe(resultado => {
      if (resultado) {
        this.service.salvar(resultado).subscribe({
          next: () => {
            this.notify.sucesso('Fornecedor atualizado!');
            this.carregarFornecedores();
          }
        });
      }
    });
  }

  abrirHistoricoGeral(fornecedor: any): void {
    this.dialog.open(HistoricoGeralComponent, {
      width: '700px',
      data: { id: fornecedor.id, nome: fornecedor.nome },
      panelClass: 'noemare-dialog',
      autoFocus: false
    });
  }

  abrirModalNovo(): void {
    this.dialog.open(FornecedorFormDialogComponent, {
      width: '450px'
    }).afterClosed().subscribe(resultado => {
      if (resultado) {
        this.service.salvar(resultado).subscribe({
          next: () => {
            this.notify.sucesso('Fornecedor cadastrado!');
            this.carregarFornecedores();
          }
        });
      }
    });
  }

  alternarStatus(fornecedor: Fornecedor): void {
    const novoStatus: StatusFornecedor = fornecedor.status === 'ATIVO' ? 'INATIVO' : 'ATIVO';
    this.service.alterarStatus(fornecedor.id, novoStatus).subscribe({
      next: () => {
        this.notify.sucesso(`Status de ${fornecedor.nome} alterado!`);
        this.carregarFornecedores();
      }
    });
  }

  get totalAtivos(): number {
    return this.fornecedores.filter(f => f.status === 'ATIVO').length;
  }

  get totalComSaldo(): number {
    return this.fornecedores.filter(f => f.saldoCredor > 0).length;
  }
}