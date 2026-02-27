import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica se o token existe através do getter que criamos no AuthService
  if (authService.token) {
    return true; // Permite o acesso à rota
  }

  // Se não houver token, redireciona para o login
  router.navigate(['/login']);
  return false;
};
