import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-redefinir-senha-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <div style="padding: 24px; text-align: center;">
      <div style="width: 50px; height: 50px; border-radius: 50%; background: #ffeeeb; color: #af2222; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
        <mat-icon style="font-size: 28px; width: 28px; height: 28px;">vpn_key</mat-icon>
      </div>
      
      <h2 style="font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Redefinir Senha</h2>
      <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 24px;">
        Defina a nova senha para <strong>{{ data.nome }}</strong>.
      </p>

      <form [formGroup]="form" style="text-align: left;">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Sua Senha (Administrador)</mat-label>
          <input matInput formControlName="senhaAdmin" [type]="ocultarAdmin ? 'password' : 'text'">
          <button mat-icon-button matSuffix (click)="ocultarAdmin = !ocultarAdmin" type="button" tabindex="-1">
            <mat-icon>{{ ocultarAdmin ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-error *ngIf="form.get('senhaAdmin')?.hasError('required')">Sua senha é obrigatória para autorizar.</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width: 100%; margin-top: 8px;">
          <mat-label>Nova Senha do Usuário</mat-label>
          <input matInput formControlName="novaSenhaUsuario" [type]="ocultarNova ? 'password' : 'text'">
          <button mat-icon-button matSuffix (click)="ocultarNova = !ocultarNova" type="button" tabindex="-1">
            <mat-icon>{{ ocultarNova ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          <mat-hint>Mínimo de 6 caracteres</mat-hint>
          <mat-error *ngIf="form.get('novaSenhaUsuario')?.hasError('minlength')">A senha deve ter pelo menos 6 dígitos.</mat-error>
        </mat-form-field>
      </form>

      <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
        <button mat-button (click)="fechar()">Cancelar</button>
        <button mat-flat-button color="primary" 
                [disabled]="form.invalid" 
                (click)="confirmar()"
                style="background-color: #2563eb; padding: 0 24px;">
          Confirmar Redefinição
        </button>
      </div>
    </div>
  `
})
export class RedefinirSenhaDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RedefinirSenhaDialogComponent>);
  
  ocultarAdmin = true;
  ocultarNova = true;

  // 👉 Ajustado para bater com o Record Java: RedefinirSenhaRequest(String senhaAdmin, String novaSenhaUsuario)
  form: FormGroup = this.fb.group({
    senhaAdmin: ['', Validators.required],
    novaSenhaUsuario: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  fechar(): void { 
    this.dialogRef.close(null); 
  }

  confirmar(): void {
    if (this.form.valid) {
      // Retorna o objeto completo { senhaAdmin: '...', novaSenhaUsuario: '...' }
      this.dialogRef.close(this.form.value);
    }
  }
}