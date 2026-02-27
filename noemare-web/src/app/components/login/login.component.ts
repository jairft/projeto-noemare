import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import { MatIconModule } from '@angular/material/icon';
import { NotifyService } from '../../services/notify.service'; // <-- Importado
import { MatDialog } from '@angular/material/dialog';
import { EsqueciSenhaDialogComponent } from './modal-esqueci-senha/esqueci-senha-dialog.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService); // <-- Injetado
  private readonly dialog = inject(MatDialog);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
  if (this.loginForm.valid) {
    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.notify.sucesso('Login realizado com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        // Tenta capturar a mensagem específica do seu ExceptionHandler do Java
        const mensagemDoBack = err.error?.mensagem || err.error?.message || 'Credenciais inválidas.';
        this.notify.erro(mensagemDoBack);
      },
    });
  }
}

abrirModalEsqueciSenha(): void {
    const dialogRef = this.dialog.open(EsqueciSenhaDialogComponent, {
      width: '400px',
      panelClass: 'custom-modal'
    });

    dialogRef.afterClosed().subscribe(emailDigitado => {
      if (emailDigitado) {
        // Envia o e-mail para a API
        this.authService.solicitarRecuperacaoSenha(emailDigitado).subscribe({
          next: () => {
            this.notify.sucesso('Solicitação enviada! Aguarde o contato do Administrador.');
          },
          error: (err) => {
            const msg = err.error?.mensagem || 'Erro ao enviar solicitação. Verifique o e-mail.';
            this.notify.erro(msg);
          }
        });
      }
    });
  }
}