import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms'; // <-- Necessário para o ngModel

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, FormsModule],
  template: `
    <div class="confirm-container">
      <div class="confirm-header" [class]="data.tipo">
        <mat-icon>{{ data.icone || 'help_outline' }}</mat-icon>
      </div>
      
      <div class="confirm-body">
        <h2 class="confirm-title">{{ data.titulo }}</h2>
        <p class="confirm-message" [innerHTML]="data.mensagem"></p>

        <mat-form-field *ngIf="data.requerSenha" appearance="outline" class="senha-field">
          <mat-label>Sua Senha de Administrador</mat-label>
          <input matInput [type]="ocultarSenha ? 'password' : 'text'" [(ngModel)]="senhaDigitada" autofocus>
          <button mat-icon-button matSuffix (click)="ocultarSenha = !ocultarSenha">
            <mat-icon>{{ ocultarSenha ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
        </mat-form-field>
      </div>

      <div class="confirm-actions">
        <button mat-button (click)="cancelar()">Cancelar</button>
        <button mat-flat-button [color]="data.tipo === 'perigo' ? 'warn' : 'primary'" 
                [disabled]="data.requerSenha && !senhaDigitada"
                (click)="confirmar()">
          {{ data.textoConfirmar || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-container { padding: 20px; text-align: center; }
    .confirm-header {
      width: 60px; height: 60px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; margin: 0 auto 16px;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
      &.perigo { background: #fef2f2; color: #ef4444; }
      &.aviso { background: #fffbeb; color: #f59e0b; }
    }
    .confirm-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: #1e293b; }
    .confirm-message { color: #64748b; margin-bottom: 20px; line-height: 1.5; }
    .senha-field { width: 100%; text-align: left; }
    .confirm-actions { display: flex; gap: 12px; justify-content: center; }
  `]
})
export class ConfirmDialogComponent {
  senhaDigitada = '';
  ocultarSenha = true;

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cancelar(): void { this.dialogRef.close(null); }
  
  confirmar(): void { 
    // Se exigir senha, devolve o texto digitado. Se não, devolve apenas 'true'
    if (this.data.requerSenha) {
      this.dialogRef.close(this.senhaDigitada);
    } else {
      this.dialogRef.close(true);
    }
  }
}