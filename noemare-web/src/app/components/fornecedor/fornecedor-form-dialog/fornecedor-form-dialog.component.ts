import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-fornecedor-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  templateUrl: './fornecedor-form-dialog.component.html',
  styleUrl: './fornecedor-form-dialog.component.scss'
})
export class FornecedorFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FornecedorFormDialogComponent>);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]]
  });

  fechar() { this.dialogRef.close(); }

  salvar() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}