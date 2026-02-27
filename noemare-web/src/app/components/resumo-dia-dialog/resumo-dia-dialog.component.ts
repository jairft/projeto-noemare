// 👉 1. Importe o 'inject' com 'i' minúsculo
import { Component, Inject, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resumo-dia-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './resumo-dia-dialog.component.html',
  styleUrl: './resumo-dia-dialog.component.scss'
})
export class ResumoDiaDialogComponent {
  
  // 👉 2. Use 'inject' com 'i' minúsculo aqui!
  private readonly router = inject(Router);

  constructor(
    public dialogRef: MatDialogRef<ResumoDiaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  irParaBoletos(): void {
    // 3. Agora a navegação vai funcionar perfeitamente
    this.fechar();
    this.router.navigate(['/boletos/novo']); 
  }

  fechar(): void {
    this.dialogRef.close();
  }
}