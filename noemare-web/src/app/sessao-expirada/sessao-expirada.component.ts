import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sessao-expirada',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './sessao-expirada.component.html',
  styleUrl: './sessao-expirada.component.scss'
})
export class SessaoExpiradaComponent {
  constructor(private dialogRef: MatDialogRef<SessaoExpiradaComponent>) {}

  confirmar(): void {
    this.dialogRef.close();
  }
}