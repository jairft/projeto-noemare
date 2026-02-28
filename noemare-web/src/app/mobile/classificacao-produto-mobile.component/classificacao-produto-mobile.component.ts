import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

// Material
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

// Serviços e Models
import { ClassificacaoProdutoService } from '../../services/classificacao-produto.service';
import { ClassificacaoProduto } from '../../models/classificacao-produto.model';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NotifyService } from '../../services/notify.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialogo/confirm-dialog.component';


@Component({
  selector: 'app-classificacao-produto-mobile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, 
    MatIconModule, MatSnackBarModule,
    NgxCurrencyDirective, RouterModule, MatDialogModule,
    MatPaginatorModule // 👉 Import do Paginador adicionado
  ],
  templateUrl: './classificacao-produto-mobile.component.html',
  styleUrls: ['./classificacao-produto-mobile.component.scss']
})
export class ClassificacaoProdutoMobileComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly service = inject(ClassificacaoProdutoService);
  private readonly notify = inject(NotifyService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  produtos: ClassificacaoProduto[] = [];
  isLoading = false;

  // 👉 Variáveis para a Paginação dos Cards
  dataSource = new MatTableDataSource<ClassificacaoProduto>([]); 
  obs$!: Observable<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Variáveis de controle para Edição
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

  // 👉 Conecta o Paginador assim que a tela renderizar
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.obs$ = this.dataSource.connect();
    setTimeout(() => this.cdr.detectChanges(), 50);
  }

  // 👉 Desconecta para evitar vazamento de memória
  ngOnDestroy() {
    if (this.dataSource) {
      this.dataSource.disconnect();
    }
  }

  carregarProdutos(): void {
    this.service.listarTodos().subscribe({
      next: (dados) => {
        this.produtos = dados;
        this.dataSource.data = dados; // 👉 Alimenta o gerenciador de paginação
        
        if (this.paginator) {
          this.paginator.pageSize = 6; // 👉 Trava o limite em 6 itens por página
        }
      },
      error: () => this.notify.erro('Erro ao carregar o catálogo de pescados.')
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.info('Preencha os dados do produto corretamente antes de salvar.');
      return;
    }

    this.isLoading = true;
    const dados = this.form.value;

    if (this.modoEdicao && this.idProdutoEmEdicao) {
      this.service.atualizar(this.idProdutoEmEdicao, dados).subscribe({
        next: () => {
          this.isLoading = false;
          this.notify.sucesso('Produto atualizado com sucesso!');
          this.finalizarFormulario();
          this.carregarProdutos();
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao atualizar o produto.');
        }
      });
    } else {
      this.service.cadastrar(dados).subscribe({ 
        next: () => {
          this.isLoading = false;
          this.notify.sucesso('Produto salvo no cardápio!');
          this.finalizarFormulario();
          this.carregarProdutos();
        },
        error: (err) => {
          this.isLoading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao salvar o produto.');
        }
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

  excluir(id: number | undefined): void {
    if(!id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '90%', 
      maxWidth: '400px',
      data: {
        titulo: 'Excluir Item',
        mensagem: 'Tem certeza que deseja remover este item?<br><b>Esta ação não poderá ser desfeita.</b>',
        tipo: 'perigo',
        icone: 'delete_forever',
        textoConfirmar: 'Remover'
      }
    });

    dialogRef.afterClosed().subscribe((confirmado) => {
      if (confirmado) {
        this.service.excluir(id).subscribe({
          next: () => {
            this.notify.sucesso('Produto removido do sistema!');
            this.carregarProdutos();
          },
          error: (err) => {
            this.notify.erro(err.error?.mensagem || 'Não é possível excluir um produto que já possui movimentações.');
          }
        });
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/home-mobile']); 
  }
}