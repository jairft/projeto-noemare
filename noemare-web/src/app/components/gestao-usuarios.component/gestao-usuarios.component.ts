import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FuncionarioService } from '../../services/funcionario.service';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { NotifyService } from '../../services/notify.service'; 
import { ConfirmService } from '../../services/confirm.service'; // <-- Importado o serviço de confirmação
import { RedefinirSenhaDialogComponent } from './redefinir-senha/redefinir-senha-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-gestao-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatCardModule,
    RouterModule
  ],
  templateUrl: './gestao-usuarios.component.html',
  styleUrl: './gestao-usuarios.component.scss'
})
export class GestaoUsuariosComponent implements OnInit {
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly notify = inject(NotifyService); 
  private readonly confirmService = inject(ConfirmService); // <-- Injetado
  private readonly dialog = inject(MatDialog);

  colunasExibidas: string[] = ['nome', 'email', 'role', 'status', 'ultimoLogin', 'acoes']; // 👉 'ultimoLogin' adicionado aqui
  usuarios: any[] = [];

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.funcionarioService.listarTodos().subscribe({
      next: (dados) => this.usuarios = dados,
      error: (err) => {
        console.error(err);
        this.notify.erro('Não foi possível carregar a lista de usuários.'); 
      }
    });
  }

 ativarUsuario(usuario: any): void {
    // Chama o modal azul de segurança pedindo a senha
    this.confirmService.autorizacaoComSenha(
      'Autorizar Acesso',
      `Para liberar o acesso de <strong>${usuario.nome}</strong> ao sistema, digite sua senha de Administrador:`,
      'Ativar Conta'
    ).subscribe(senhaDigitada => {
      
      // Se a senha foi digitada e confirmada
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

  // --- NOVO MÉTODO DE EXCLUSÃO COM MODAL ---
  excluirUsuario(usuario: any): void {
    this.confirmService.perigoComSenha(
      'Autorização Necessária',
      `Para excluir permanentemente o acesso de <strong>${usuario.nome}</strong>, digite sua senha de Administrador:`
    ).subscribe(senhaDigitada => {
      
      // Se a senhaDigitada não for nula/vazia, o admin clicou em confirmar
      if (senhaDigitada) {
        this.funcionarioService.excluirComSenha(usuario.id, senhaDigitada).subscribe({
          next: () => {
            this.notify.sucesso('Usuário removido com sucesso!');
            this.carregarUsuarios();
          },
          error: (err) => {
            // Se a senha estiver errada, o back-end vai mandar o erro pra cá
            const msg = err.error?.mensagem || 'Erro ao excluir o usuário.';
            this.notify.erro(msg);
          }
        });
      }
    });
  }

  abrirModalRedefinirSenha(usuario: any): void {
    const dialogRef = this.dialog.open(RedefinirSenhaDialogComponent, {
      width: '400px',
      data: { nome: usuario.nome }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.funcionarioService.redefinirSenha(usuario.id, resultado).subscribe({
          next: () => {
            this.notify.sucesso(`A senha de ${usuario.nome} foi redefinida com sucesso!`);
            this.carregarUsuarios(); // Remove o usuário da lista de pendências
          },
          error: (err) => {
            const msg = err.error?.mensagem || 'Erro ao redefinir a senha.';
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