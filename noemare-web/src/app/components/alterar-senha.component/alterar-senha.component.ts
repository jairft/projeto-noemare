import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FuncionarioService } from '../../services/funcionario.service';
import { NotifyService } from '../../services/notify.service';

@Component({
  selector: 'app-alterar-senha',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    MatIconModule,
  ],
  templateUrl: './alterar-senha.component.html',
  styleUrls: ['./alterar-senha.component.scss']
})
export class AlterarSenhaComponent implements OnInit {

  private readonly fb = inject(FormBuilder);
  private readonly funcionarioService = inject(FuncionarioService);
  private readonly notify = inject(NotifyService);

  formSenha!: FormGroup;

  ngOnInit(): void {
    this.formSenha = this.fb.group({
      senhaAtual:     ['', [Validators.required]],
      novaSenha:      ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.checkPasswords });
  }

  checkPasswords(group: FormGroup) {
    const pass        = group.get('novaSenha')?.value;
    const confirmPass = group.get('confirmarSenha')?.value;
    return pass === confirmPass ? null : { notSame: true };
  }

  salvarNovaSenha() {
    if (this.formSenha.valid) {
      this.funcionarioService.alterarSenhaPropria(this.formSenha.value).subscribe({
        next: () => {
          // Exibe o sucesso quando o Java retorna HTTP 200 ou 204
          this.notify.sucesso('Senha alterada com sucesso!');
          this.formSenha.reset();
        },
        error: (err) => {
          const mensagemErro = err.error?.mensagem || 'Não foi possível alterar a senha.';
          
          // Exibe a mensagem real vinda da RegraNegocioException
          this.notify.erro(mensagemErro);
        }
      });
    }
  }
}