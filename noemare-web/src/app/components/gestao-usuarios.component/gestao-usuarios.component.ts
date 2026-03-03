import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

// Services e Componentes
import { FuncionarioService } from '../../services/funcionario.service';
import { NotifyService } from '../../services/notify.service'; 
import { ConfirmService } from '../../services/confirm.service'; 
import { RedefinirSenhaDialogComponent } from './redefinir-senha/redefinir-senha-dialog.component';

@Component({
  selector: 'app-gestao-usuarios',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatTooltipModule, MatSnackBarModule, MatCardModule,
    MatDialogModule, MatPaginatorModule
  ],
  templateUrl: './gestao-usuarios.component.html',
  styleUrl: './gestao-usuarios.component.scss'
})
export class GestaoUsuariosComponent implements OnInit {
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly notify = inject(NotifyService); 
  private readonly confirmService = inject(ConfirmService); 
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  isLoading: boolean = true; 
  usuarios: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  colunasExibidas: string[] = ['nome', 'email', 'role', 'status', 'ultimoLogin', 'acoes'];

  private _paginator!: MatPaginator;
  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    if (mp) {
      this._paginator = mp;
      this.dataSource.paginator = this._paginator;
    }
  }

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.isLoading = true; 
    this.funcionarioService.listarTodos().subscribe({
      next: (dados) => {
        this.usuarios = dados;
        this.dataSource.data = dados;
        this.isLoading = false; 
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.notify.erro('Não foi possível carregar a lista de usuários.'); 
        this.isLoading = false;
      }
    });
  }

  ativarUsuario(usuario: any): void {
    this.confirmService.autorizacaoComSenha(
      'Autorizar Acesso',
      `Para liberar o acesso de <strong>${usuario.nome}</strong> ao sistema, digite sua senha de Administrador:`,
      'Ativar Conta'
    ).subscribe(senhaDigitada => {
      if (senhaDigitada) {
        this.funcionarioService.ativarConta(usuario.id, senhaDigitada).subscribe({
          next: () => {
            this.notify.sucesso(`A conta de ${usuario.nome} foi ativada com sucesso!`); 
            this.carregarUsuarios(); 
          },
          error: (err) => {
            const msg = err.error?.mensagem || 'Erro ao tentar ativar o usuário.';
            this.notify.erro(msg); 
          }
        });
      }
    });
  }

  excluirUsuario(usuario: any): void {
    this.confirmService.perigoComSenha(
      'Autorização Necessária',
      `Para excluir permanentemente o acesso de <strong>${usuario.nome}</strong>, digite sua senha de Administrador:`
    ).subscribe(senhaDigitada => {
      if (senhaDigitada) {
        this.funcionarioService.excluirComSenha(usuario.id, senhaDigitada).subscribe({
          next: () => {
            this.notify.sucesso('Usuário removido com sucesso!');
            this.carregarUsuarios();
          },
          error: (err) => {
            const msg = err.error?.mensagem || 'Erro ao excluir o usuário.';
            this.notify.erro(msg);
          }
        });
      }
    });
  }

  /**
   * 👉 MÉTODO AJUSTADO: Agora lida com o fluxo de segurança do Admin
   */
  abrirModalRedefinirSenha(usuario: any): void {
    // 1. Abre o modal único que já pede a senha do Admin e a Nova Senha
    const dialogRef = this.dialog.open(RedefinirSenhaDialogComponent, {
      width: '400px',
      data: { nome: usuario.nome }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      // O 'resultado' aqui já vem preenchido com { senhaAdmin, novaSenhaUsuario }
      if (resultado) {
        // 2. Envia direto para o service sem pedir confirmação extra
        this.funcionarioService.redefinirSenha(
          usuario.id, 
          resultado.novaSenhaUsuario, 
          resultado.senhaAdmin
        ).subscribe({
          next: () => {
            this.notify.sucesso(`A senha de ${usuario.nome} foi redefinida com sucesso!`);
            this.carregarUsuarios();
          },
          error: (err) => {
            const msg = err.error?.mensagem || 'Senha de administrador incorreta ou erro no servidor.';
            this.notify.erro(msg);
          }
        });
      }
    });
  }

  get totalAtivos(): number {
    return this.usuarios.filter(u => u.statusConta === 'ATIVO').length;
  }
  
  get totalPendentes(): number {
    return this.usuarios.filter(u => u.statusConta !== 'ATIVO').length;
  }

  get solicitacoesSenha(): any[] {
    return this.usuarios.filter(u => u.solicitouRecuperacaoSenha === true);
  }
}