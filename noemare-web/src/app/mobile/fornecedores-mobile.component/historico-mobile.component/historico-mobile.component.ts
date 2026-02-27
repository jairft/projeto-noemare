import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule } from '@angular/material/bottom-sheet';

import { FornecedorService } from '../../../services/fornecedor.service';
import { NotifyService } from '../../../services/notify.service';

@Component({
  selector: 'app-historico-mobile',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatProgressSpinnerModule,
    MatBottomSheetModule
  ],
  templateUrl: './historico-mobile.component.html',
  styleUrl: './historico-mobile.component.scss'
})
export class HistoricoMobileComponent implements OnInit {
  private readonly service = inject(FornecedorService);
  private readonly notify = inject(NotifyService);
  private readonly bottomSheetRef = inject(MatBottomSheetRef<HistoricoMobileComponent>);

  resumo: any = { kgGeral: 0, valorGeral: 0, itensAgrupados: [] };
  carregando = true;

  // Recebe os dados via MAT_BOTTOM_SHEET_DATA em vez de MAT_DIALOG_DATA
  constructor(@Inject(MAT_BOTTOM_SHEET_DATA) public data: { id: number, nome: string }) {}

  ngOnInit(): void {
    this.service.obterHistoricoGeral(this.data.id).subscribe({
      next: (res) => {
        this.resumo = res;
        this.carregando = false;
      },
      error: () => {
        this.notify.erro('Erro ao carregar o histórico do fornecedor.');
        this.fechar();
      }
    });
  }

  fechar(event?: MouseEvent): void {
    if (event) { event.preventDefault(); }
    this.bottomSheetRef.dismiss();
  }
}