import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-esqueci-senha-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <div style="padding: 24px; text-align: center;">
      <div style="width: 50px; height: 50px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <mat-icon style="font-size: 28px; width: 28px; height: 28px;">lock_reset</mat-icon>
      </div>
      
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Esqueceu sua senha?</h2>
      <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 24px; line-height: 1.5;">
        Informe o e-mail cadastrado. Uma solicitação será enviada para o <strong>Administrador</strong> realizar a alteração da sua senha.
      </p>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Seu e-mail de acesso</mat-label>
          <input matInput formControlName="email" type="email" placeholder="exemplo@email.com">
          <mat-icon matPrefix style="margin-right: 8px; color: #94a3b8;">mail</mat-icon>
          <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
          <mat-error *ngIf="form.get('email')?.hasError('required')">O e-mail é obrigatório</mat-error>
        </mat-form-field>
      </form>

      <div style="display: flex; gap: 12px; justify-content: center; margin-top: 16px;">
        <button mat-button (click)="fechar()">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="enviar()">
          Enviar Solicitação
        </button>
      </div>
    </div>
  `
})
export class EsqueciSenhaDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EsqueciSenhaDialogComponent>);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  fechar(): void {
    this.dialogRef.close(null);
  }

  enviar(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.email);
    }
  }
}