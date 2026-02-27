import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Material Modules
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services e Models
import { NotaFornecedorService } from '../../../services/nota-fornecedor.service';
import { NotifyService } from '../../../services/notify.service'; // <-- Importado

@Component({
  selector: 'app-historico-pagamento',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './historico-pagamento.component.html',
  styleUrl: './historico-pagamento.component.scss'
})
export class HistoricoPagamentoComponent implements OnInit {
  private readonly notaService = inject(NotaFornecedorService);
  private readonly dialogRef = inject(MatDialogRef<HistoricoPagamentoComponent>);
  private readonly notify = inject(NotifyService); // <-- Injetado
  
  historico: any[] = [];
  carregando = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    const idParaBusca = this.data?.id || this.data?.idNota || this.data?.notaId;

    if (!idParaBusca || idParaBusca === 'undefined') {
      this.notify.erro('Erro técnico: ID da nota não identificado.');
      this.carregando = false;
      return;
    }

    // Agora o 'idParaBusca' terá o valor correto (2, 4, etc) em qualquer tela
    this.notaService.buscarHistoricoPagamentos(idParaBusca).subscribe({
      next: (res) => {
        this.historico = res;
        this.carregando = false;
        if (res.length === 0) {
          this.notify.info('Nenhum registro de pagamento encontrado.');
        }
      },
      error: (err) => {
        this.carregando = false;
        this.notify.erro(err.error?.mensagem || 'Erro ao carregar histórico.');
      }
    });
  }

  fechar(): void {
    this.dialogRef.close();
  }
}