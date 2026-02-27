import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { HistoricoNotaResponse } from '../../../models/nota.model';

// Modelos


@Component({
  selector: 'app-recibo-nota',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './recibo-nota.component.html',
  styleUrl: './recibo-nota.component.scss'
})
export class ReciboNotaComponent {
  
  // Variável que diz qual formato o HTML deve assumir na hora de imprimir
  formatoAtual: 'termica' | 'a4' = 'termica';

  constructor(
    public dialogRef: MatDialogRef<ReciboNotaComponent>,
    @Inject(MAT_DIALOG_DATA) public nota: HistoricoNotaResponse
  ) {}

  imprimir(formato: 'termica' | 'a4'): void {
    // 1. Muda a variável para aplicar a classe CSS correta no HTML
    this.formatoAtual = formato;
    
    // 2. Dá um pequeno atraso (100ms) pro Angular atualizar a tela antes de travar abrindo a janela do Windows
    setTimeout(() => {
      window.print();
    }, 100);
  }

  fechar(): void {
    this.dialogRef.close();
  }
}