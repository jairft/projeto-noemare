import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxCurrencyDirective } from 'ngx-currency';
import { EmprestimoService } from '../../../services/emprestimo.service'; // Atualizado
import { NotifyService } from '../../../services/notify.service';

@Component({
  selector: 'app-pagamento-emprestimo-dialog', // Atualizado
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    NgxCurrencyDirective
  ],
  templateUrl: './pagamento-emprestimo-dialog.html',
  styleUrl: './pagamento-emprestimo-dialog.scss'
})
export class PagamentoEmprestimoDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly emprestimoService = inject(EmprestimoService); // Atualizado
  private readonly notify = inject(NotifyService);

  form: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<PagamentoEmprestimoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Define o valor máximo permitido como o saldo restante ou total
    const saldoMaximo = data.saldoRestante || data.valorTotal;

    this.form = this.fb.group({
      valor: [saldoMaximo, [
        Validators.required, 
        Validators.min(0.01), 
        Validators.max(saldoMaximo)
      ]],
      descricao: ['', [Validators.maxLength(255)]]
    });
  }

  confirmar(): void {
    if (this.form.valid) {
      this.loading = true;
      
      const payload = {
        emprestimoId: this.data.id, // Atualizado: deve ser 'emprestimoId' para o Java reconhecer
        valor: this.form.value.valor,
        descricao: this.form.value.descricao
      };

      this.emprestimoService.registrarPagamento(payload).subscribe({ // Atualizado
        next: () => {
          this.notify.sucesso('Pagamento registrado com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.loading = false;
          this.notify.erro(err.error?.mensagem || 'Erro ao processar pagamento.');
        }
      });
    }
  }
}