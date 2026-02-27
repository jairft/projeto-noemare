import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Meus arquivos
import { ClassificacaoProdutoService } from '../../services/classificacao-produto.service';
import { ClassificacaoProduto } from '../../models/classificacao-produto.model';
import { NgxCurrencyDirective } from 'ngx-currency';
import { NotifyService } from '../../services/notify.service';
import { ConfirmService } from '../../services/confirm.service'; 
import { ConfirmDialogComponent } from '../confirm-dialogo/confirm-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-classificacao-produto',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatTableModule, MatCardModule, MatIconModule, MatSnackBarModule,
    NgxCurrencyDirective, RouterModule, MatDialogModule
  ],
  templateUrl: './classificacao-produto.component.html',
  styleUrl: './classificacao-produto.component.scss'
})
export class ClassificacaoProdutoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClassificacaoProdutoService);
  private readonly notify = inject(NotifyService);
  private readonly confirmService = inject(ConfirmService); 
  private readonly dialog = inject(MatDialog);

  produtos: ClassificacaoProduto[] = [];
  colunas: string[] = ['nome', 'tipo', 'tamanho', 'precoUnitario', 'acoes'];

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

  carregarProdutos(): void {
    this.service.listarTodos().subscribe({
      next: (dados) => this.produtos = dados,
      error: () => this.notify.erro('Erro ao carregar o catalogo de pescados.')
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.notify.info('Preencha os dados do produto corretamente antes de salvar.');
      return;
    }

    const dados = this.form.value;

    if (this.modoEdicao && this.idProdutoEmEdicao) {
      // 👉 Lógica de UPDATE (Atualizar)
      this.service.atualizar(this.idProdutoEmEdicao, dados).subscribe({
        next: () => {
          this.notify.sucesso('Produto atualizado com sucesso!');
          this.finalizarFormulario();
          this.carregarProdutos();
        },
        error: (err) => {
          const msg = err.error?.mensagem || 'Erro ao atualizar o produto no sistema.';
          this.notify.erro(msg);
        }
      });
    } else {
      // 👉 Lógica de CREATE (Cadastrar/Salvar)
      // Ajuste 'cadastrar' para 'salvar' dependendo de como está o nome no seu service.ts
      this.service.cadastrar(dados).subscribe({ 
        next: () => {
          this.notify.sucesso('Produto salvo no cardápio com sucesso!');
          this.finalizarFormulario();
          this.carregarProdutos();
        },
        error: (err) => {
          const msg = err.error?.mensagem || 'Erro ao salvar o produto no sistema.';
          this.notify.erro(msg);
        }
      });
    }
  }

  editar(produto: ClassificacaoProduto): void {
    this.modoEdicao = true;
    this.idProdutoEmEdicao = produto.id || null; // Salva o ID do item clicado
    this.form.patchValue(produto); // Preenche os inputs
    this.notify.info(`Editando: ${produto.nome}`);
  }

  // 👉 Novo método para limpar a tela após salvar, atualizar ou cancelar
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

    dialogRef.afterClosed().subscribe((confirmado: boolean | string | null) => {
      if (confirmado) {
        this.service.excluir(id).subscribe({
          next: () => {
            this.notify.sucesso('Produto removido do sistema!');
            this.carregarProdutos();
          },
          error: (err) => {
            const msg = err.error?.mensagem || 'Não é possível excluir um produto que já possui movimentações.';
            this.notify.erro(msg);
          }
        });
      }
    });
  }
}