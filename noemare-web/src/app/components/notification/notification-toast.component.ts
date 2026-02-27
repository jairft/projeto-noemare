import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-container" [class]="data.type">
      <mat-icon class="toast-icon">{{ data.icon }}</mat-icon>
      <div class="toast-content">
        <span class="toast-message">{{ data.message }}</span>
      </div>
      <button class="toast-close" (click)="snackBarRef.dismiss()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .toast-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      min-height: 80px; /* Mais alto */
      border-radius: 12px;
    }
    .toast-icon { font-size: 28px; width: 28px; height: 28px; }
    .toast-content { flex: 1; display: flex; flex-direction: column; }
    .toast-message { font-size: 0.95rem; font-weight: 500; line-height: 1.4; }
    .toast-close { 
      background: transparent; border: none; cursor: pointer; color: inherit;
      display: flex; align-items: center; justify-content: center; opacity: 0.7;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class NotificationToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: any,
    public snackBarRef: MatSnackBarRef<NotificationToastComponent>
  ) {}
}