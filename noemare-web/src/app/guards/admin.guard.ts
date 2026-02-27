import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadDecoded = atob(payloadBase64);
      const payload = JSON.parse(payloadDecoded);

      // Limpa a role caso o Spring Boot envie com o prefixo "ROLE_"
      const role = (payload.role || '').replace('ROLE_', '');

      if (role === 'ADMIN') {
        return true; // Acesso liberado!
      }
    } catch (error) {
      console.error('Erro ao decodificar token no AdminGuard', error);
    }
  }

  // Se não for admin ou o token for inválido, manda de volta pro dashboard (ou login)
  router.navigate(['/dashboard']);
  return false;
};