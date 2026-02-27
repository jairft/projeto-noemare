import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SessaoExpiradaComponent } from '../sessao-expirada/sessao-expirada.component';


export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const dialog = inject(MatDialog);
  const router = inject(Router);
  const token = authService.token;

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 👉 LOG DE DEBUG: Abra o F12 e veja qual número aparece aqui!
      console.warn(`Interceptor capturou erro ${error.status} para: ${req.url}`);

      // 👉 A CORREÇÃO: Aceitar 401 (Expirado) ou 403 (Proibido/Sessão inválida)
      if (error.status === 401 || error.status === 403) {
        
        // Verifica se já não existe um modal de erro aberto para não acumular
        if (dialog.openDialogs.length === 0) {
          const dialogRef = dialog.open(SessaoExpiradaComponent, {
            width: '400px',
            disableClose: true 
          });

          dialogRef.afterClosed().subscribe(() => {
            authService.logout(); // 👉 Usa o seu método logout()
            router.navigate(['/login']); 
          });
        }
      }
      return throwError(() => error);
    })
  );
};