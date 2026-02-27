import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FornecedorService } from '../../../services/fornecedor.service';
import { NotifyService } from '../../../services/notify.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-historico-geral',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './historico-geral.component.html',
  styleUrl: './historico-geral.component.scss'
})
export class HistoricoGeralComponent implements OnInit {
  private readonly service = inject(FornecedorService);
  private readonly notify = inject(NotifyService);
  private readonly dialogRef = inject(MatDialogRef<HistoricoGeralComponent>);

  resumo: any = { kgGeral: 0, valorGeral: 0, itensAgrupados: [] };
  carregando = true;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { id: number, nome: string }) {}

  ngOnInit(): void {
    this.service.obterHistoricoGeral(this.data.id).subscribe({
      next: (res) => {
        this.resumo = res;
        this.carregando = false;
      },
      error: () => {
        this.notify.erro('Erro ao carregar o histórico geral do fornecedor.');
        this.dialogRef.close();
      }
    });
  }

  fechar() { this.dialogRef.close(); }
}