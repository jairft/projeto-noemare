import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../components/confirm-dialogo/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(MatDialog);

  pergunta(titulo: string, mensagem: string): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { titulo, mensagem, tipo: 'aviso', icone: 'help' },
      panelClass: 'confirm-panel-premium'
    });
    return dialogRef.afterClosed();
  }

  // Adicione junto aos outros métodos do confirm.service.ts
  perigoComSenha(titulo: string, mensagem: string): Observable<string | null> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        titulo, 
        mensagem, 
        tipo: 'perigo', 
        icone: 'admin_panel_settings', // Ícone de segurança
        textoConfirmar: 'Excluir Definitivamente', 
        requerSenha: true // Ativa o campo de input!
      },
      panelClass: 'confirm-panel-premium'
    });
    return dialogRef.afterClosed();
  }

  perigo(titulo: string, mensagem: string): Observable<boolean> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { titulo, mensagem, tipo: 'perigo', icone: 'delete_forever', textoConfirmar: 'Excluir' },
      panelClass: 'confirm-panel-premium'
    });
    return dialogRef.afterClosed();
  }

  autorizacaoComSenha(titulo: string, mensagem: string, textoConfirmar: string = 'Confirmar'): Observable<string | null> {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { 
        titulo, 
        mensagem, 
        tipo: 'aviso', // Não usamos 'perigo' para que o botão fique azul/verde
        icone: 'security', // Ícone de escudo
        textoConfirmar: textoConfirmar, 
        requerSenha: true 
      },
      panelClass: 'confirm-panel-premium'
    });
    return dialogRef.afterClosed();
  }
}