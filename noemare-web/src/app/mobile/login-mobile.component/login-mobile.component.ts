import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

// 👉 NOVO: Importações do Material Dialog e do componente do Modal
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EsqueciSenhaDialogComponent } from '../../components/login/modal-esqueci-senha/esqueci-senha-dialog.component';

@Component({
  selector: 'app-login-mobile',
  standalone: true,
  // 👉 NOVO: MatDialogModule adicionado ao array de imports
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatDialogModule],
  templateUrl: './login-mobile.component.html',
  styleUrls: ['./login-mobile.component.scss']
})
export class LoginMobileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // 👉 NOVO: Injeção do serviço de Dialog
  private dialog = inject(MatDialog);

  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

 onLoginMobile(): void {
    if (this.loginForm.invalid) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.router.navigate(['/home-mobile']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        
        // 👉 Tenta pegar a mensagem de erro formatada pelo seu Back-end (GlobalExceptionHandler)
        const mensagemBackend = err.error?.mensagem || err.error?.message;

        if (mensagemBackend) {
          // Se o back-end mandou "Usuário bloqueado" ou "Senha incorreta", exibe isso:
          this.errorMessage = mensagemBackend;
        } else if (err.status === 403 || err.status === 401) {
          // Fallback caso o Spring Security bloqueie sem mandar um JSON detalhado
          this.errorMessage = 'E-mail ou senha incorretos. Tente novamente.';
        } else {
          // Fallback para quando o servidor estiver fora do ar (erro 500 ou 0)
          this.errorMessage = 'Erro ao conectar com o servidor. Tente mais tarde.';
        }
      }
    });
  }

  // 👉 NOVO: Método para abrir o modal de esqueci a senha
  abrirModalEsqueciSenha(): void {
    this.dialog.open(EsqueciSenhaDialogComponent, {
      width: '90%', // Usa porcentagem para ficar responsivo no celular
      maxWidth: '400px',
      panelClass: 'custom-modal', // Classe de estilo (se você usar no global)
      autoFocus: false
    });
  }
}