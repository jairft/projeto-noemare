import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-config-logs-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  templateUrl: './config-logs-dialog.component.html',
  styleUrl: './config-logs-dialog.component.scss'
})
export class ConfigLogsDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ConfigLogsDialogComponent>);

  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.form = this.fb.group({
      diasRetencaoLogs: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      horarioLimpezaLogs: ['03:00', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.form.patchValue({
        diasRetencaoLogs: this.data.diasRetencaoLogs,
        // Converte '03:00:00' para '03:00' para o input HTML5
        horarioLimpezaLogs: this.data.horarioLimpezaLogs?.substring(0, 5) || '03:00'
      });
    }
  }

  salvar(): void {
    if (this.form.valid) {
      const dados = {
        ...this.form.value,
        // Adiciona os segundos de volta para o LocalTime do Java
        horarioLimpezaLogs: this.form.value.horarioLimpezaLogs + ':00'
      };
      this.dialogRef.close(dados);
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }
}