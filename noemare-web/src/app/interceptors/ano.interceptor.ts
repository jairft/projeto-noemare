import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
// Importa o serviço que criamos antes. Ajuste os pontos (../) se a pasta services estiver noutro lugar
import { AnoContextoService } from '../services/ano-contexto.service'; 

export const anoInterceptor: HttpInterceptorFn = (req, next) => {
  const anoContexto = inject(AnoContextoService);
  const ano = anoContexto.getAnoAtual();

  // 1. Ignora rotas que não precisam saber o ano (Login, ViaCEP, etc.)
  if (req.url.includes('/login') || req.url.includes('viacep') || req.url.includes('auth')) {
    return next(req);
  }

  // 2. Clona a requisição já com o Token e adiciona o parâmetro 'ano' na URL
  const reqModificada = req.clone({
    setParams: {
      ano: ano.toString()
    }
  });

  return next(reqModificada);
};