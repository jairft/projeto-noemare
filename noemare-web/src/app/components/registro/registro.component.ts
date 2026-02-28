import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegistroRequest } from '../../models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { NotifyService } from '../../services/notify.service'; 

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService); 

  isLoading = false; // 👉 Variável de controle do spinner adicionada

  registroForm = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    sobrenome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    confirmacaoSenha: ['', Validators.required],
    role: ['USER' as 'ADMIN' | 'USER', Validators.required],
    codigoMestre: [''],
  });

  onSubmit() {
    if (this.registroForm.valid) {
      this.isLoading = true; // 👉 Inicia o spinner e bloqueia o botão

      const dados = this.registroForm.getRawValue() as RegistroRequest;

      // Validação local de senha com o Notify
      if (dados.senha !== dados.confirmacaoSenha) {
        this.isLoading = false; // 👉 Desbloqueia o botão se errar a digitação da senha
        this.notify.erro('As senhas não conferem!'); 
        return;
      }

      this.authService.registrar(dados).subscribe({
        next: () => {
          this.isLoading = false; // 👉 Para o spinner no sucesso
          // Feedback de sucesso elegante
          this.notify.sucesso('Solicitação enviada! Aguarde a ativação por um administrador.'); 
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.isLoading = false; // 👉 Para o spinner no erro
          // Captura a mensagem de erro do backend (ex: código mestre inválido)
          const msg = err.error?.mensagem || 'Erro ao registrar. Verifique os dados ou o código mestre.';
          this.notify.erro(msg); 
        },
      });
    } else {
      this.notify.info('Por favor, preencha todos os campos obrigatórios corretamente.');
    }
  }
}