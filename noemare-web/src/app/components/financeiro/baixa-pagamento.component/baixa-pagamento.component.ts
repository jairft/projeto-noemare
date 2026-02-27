import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Material
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Máscara e Serviços
import { NgxCurrencyDirective } from 'ngx-currency';
import { FornecedorService } from '../../../services/fornecedor.service';
import { NotifyService } from '../../../services/notify.service'; 

@Component({
  selector: 'app-baixa-pagamento',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, 
    MatIconModule, NgxCurrencyDirective
  ],
  templateUrl: './baixa-pagamento.component.html',
  styleUrl: './baixa-pagamento.component.scss'
})
export class BaixaPagamentoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<BaixaPagamentoComponent>);
  private readonly fornecedorService = inject(FornecedorService);
  private readonly notify = inject(NotifyService); 
  
  pagamentoForm: FormGroup;
  valorPendente: number;
  
  saldoInvestimento: number = 0;
  saldoAdiantamento: number = 0;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.valorPendente = data.faltaPagarNumero;

    this.pagamentoForm = this.fb.group({
      abateInvestimento: [0, [Validators.min(0)]],
      abateAdiantamento: [0, [Validators.min(0)]],
      valorPago: [this.valorPendente, [Validators.required, Validators.min(0)]], 
      dataPagamento: [new Date().toISOString().substring(0, 10), Validators.required],
      observacao: ['']
    });
  }

  ngOnInit(): void {
    // 👉 REGRA DE LOTE ATUALIZADA:
    // Mantemos o valor em dinheiro bloqueado para ele não pagar parcial,
    // Mas DEIXAMOS os abatimentos livres para ele usar o saldo das dívidas!
    if (this.data.isLote) {
      this.pagamentoForm.get('valorPago')?.disable();
      
      this.notify.info('Lote: Digite os abatimentos se desejar. O valor em dinheiro será calculado automaticamente.');
    }

    if (this.data.fornecedorId) {
      this.fornecedorService.buscarSaldosDevedores(this.data.fornecedorId).subscribe({
        next: (res) => {
          this.saldoInvestimento = res.saldoInvestimento || 0;
          this.saldoAdiantamento = res.saldoAdiantamento || 0;

          // 👉 AGORA APLICA AS VALIDAÇÕES DE ABATIMENTO MESMO SE FOR LOTE
          this.pagamentoForm.get('abateInvestimento')?.setValidators([Validators.min(0), Validators.max(this.saldoInvestimento)]);
          this.pagamentoForm.get('abateAdiantamento')?.setValidators([Validators.min(0), Validators.max(this.saldoAdiantamento)]);
          
          if (!this.data.isLote) {
            this.pagamentoForm.get('valorPago')?.setValidators([Validators.required, Validators.min(0), Validators.max(this.valorPendente)]);
          }
          
          this.pagamentoForm.get('abateInvestimento')?.updateValueAndValidity();
          this.pagamentoForm.get('abateAdiantamento')?.updateValueAndValidity();
          this.pagamentoForm.get('valorPago')?.updateValueAndValidity();
        },
        error: (err) => {
          console.error(err);
          this.notify.erro('Não foi possível carregar os saldos do fornecedor para abatimento.'); 
        }
      });
    } else {
      this.notify.info('Atenção: ID do fornecedor não identificado. Abatimentos desabilitados.'); 
    }

    this.pagamentoForm.get('abateInvestimento')?.valueChanges.subscribe(() => this.recalcularValorLiquido());
    this.pagamentoForm.get('abateAdiantamento')?.valueChanges.subscribe(() => this.recalcularValorLiquido());
  }

  recalcularValorLiquido(): void {
    const invest = this.pagamentoForm.get('abateInvestimento')?.value || 0;
    const adiant = this.pagamentoForm.get('abateAdiantamento')?.value || 0;

    let novoValorLiquido = this.valorPendente - invest - adiant;

    if (novoValorLiquido < 0) {
      novoValorLiquido = 0;
      this.notify.info('O valor dos abatimentos não pode exceder o total das notas.'); 
    }

    // Mesmo estando disabled no lote, o patchValue atualiza o campo visualmente para o usuário
    this.pagamentoForm.patchValue({ valorPago: novoValorLiquido }, { emitEvent: false });
  }

  confirmarPagamento(): void {
    if (this.pagamentoForm.valid) {
      this.dialogRef.close(this.pagamentoForm.getRawValue());
    } else {
      this.notify.erro('Verifique os valores informados e os limites de saldo do fornecedor.'); 
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }
}