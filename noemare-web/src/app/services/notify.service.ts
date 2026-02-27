import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationToastComponent } from '../components/notification/notification-toast.component';


@Injectable({ providedIn: 'root' })
export class NotifyService {
  private readonly snackBar = inject(MatSnackBar);

  private abrir(message: string, type: 'sucesso' | 'erro' | 'info', icon: string) {
    this.snackBar.openFromComponent(NotificationToastComponent, {
      data: { message, type, icon },
      duration: 6000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [`notify-${type}-container`] // Classe para o posicionamento
    });
  }

  sucesso(msg: string) { this.abrir(msg, 'sucesso', 'check_circle'); }
  erro(msg: string) { this.abrir(msg, 'erro', 'warning'); }
  info(msg: string) { this.abrir(msg, 'info', 'info'); }
}