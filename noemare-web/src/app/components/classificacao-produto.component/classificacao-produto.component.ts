import { Component, OnInit, AfterViewInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table'; 
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator'; 
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Meus arquivos
import { ClassificacaoProdutoService } from '../../services/classificacao-produto.service';
import { ClassificacaoProduto } from '../../models/classificacao-produto.model';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NotifyService } from '../../services/notify.service';
import { ConfirmDialogComponent } from '../confirm-dialogo/confirm-dialog.component';

@Component({
  selector: 'app-classificacao-produto',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatTableModule, MatCardModule, MatIconModule, MatSnackBarModule,
    NgxCurrencyDirective, RouterModule, MatDialogModule, MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './classificacao-produto.component.html',
  styleUrl: './classificacao-produto.component.scss'
})
export class ClassificacaoProdutoComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClassificacaoProdutoService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading: boolean = true; // 👉 Começa carregando o catálogo
  produtos: ClassificacaoProduto[] = [];
  dataSource = new MatTableDataSource<ClassificacaoProduto>([]);
  colunas: string[] = ['nome', 'tipo', 'tamanho', 'precoUnitario', 'acoes'];

  // 👉 SOLUÇÃO DO PAGINADOR: Setter para capturar o elemento quando ele surgir no HTML
  private _paginator!: MatPaginator;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    if (mp) {
      this._paginator = mp;
      this.dataSource.paginator = this._paginator;
    }
  }

  modoEdicao = false;
  idProdutoEmEdicao: number | null = null;

  form: FormGroup = this.fb.group({
    id: [null],
    nome: ['', Validators.required],
    tipo: ['', Validators.required],
    tamanho: [''], 
    precoUnitario: [null, [Validators.required, Validators.min(0.01)]]
  });

  ngOnInit(): void {
    this.carregarProdutos();
  }

  ngAfterViewInit(): void {
    // Força uma detecção de mudanças para evitar erro de ExpressionChanged
    this.cdr.detectChanges();
  }

  carregarProdutos(): void {
    this.isLoading = true; // 👉 Liga o loading
    this.service.listarTodos().subscribe({
      next: (dados) => {
        this.produtos = dados;
        this.dataSource.data = dados;
        this.isLoading = false; // 👉 Desliga no sucesso
      },
      error: () => {
        this.notify.erro('Erro ao carregar o catálogo de pescados.');
        this.isLoading = false; // 👉 Desliga no erro
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.notify.info('Preencha os dados do produto corretamente antes de salvar.');
      return;
    }

    const dados = this.form.value;

    if (this.modoEdicao && this.idProdutoEmEdicao) {
      this.service.atualizar(this.idProdutoEmEdicao, dados).subscribe({
        next: () => {
          this.notify.sucesso('Produto atualizado!');
          this.finalizarFormulario();
          this.carregarProdutos(); // Atualiza a lista com loading
        },
        error: (err) => this.notify.erro(err.error?.mensagem || 'Erro ao atualizar.')
      });
    } else {
      this.service.cadastrar(dados).subscribe({ 
        next: () => {
          this.notify.sucesso('Produto salvo no catálogo!');
          this.finalizarFormulario();
          this.carregarProdutos(); // Atualiza a lista com loading
        },
        error: (err) => this.notify.erro(err.error?.mensagem || 'Erro ao salvar.')
      });
    }
  }

  editar(produto: ClassificacaoProduto): void {
    this.modoEdicao = true;
    this.idProdutoEmEdicao = produto.id || null; 
    this.form.patchValue(produto); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.notify.info(`Editando: ${produto.nome}`);
  }

  finalizarFormulario(): void {
    this.form.reset();
    this.modoEdicao = false;
    this.idProdutoEmEdicao = null;
  }

  excluir(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir Item do Catálogo',
        mensagem: 'Tem certeza que deseja remover este item?<br><b>Esta ação não poderá ser desfeita.</b>',
        tipo: 'perigo',
        icone: 'delete_forever',
        textoConfirmar: 'Remover Item'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.service.excluir(id).subscribe({
          next: () => {
            this.notify.sucesso('Produto removido!');
            this.carregarProdutos();
          },
          error: (err) => this.notify.erro(err.error?.mensagem || 'Erro ao excluir.')
        });
      }
    });
  }
}