import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Importações vitais para o idioma português (Brasil)
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { jwtInterceptor } from './interceptors/jwt-interceptor';
import { anoInterceptor } from './interceptors/ano.interceptor';

// 👉 IMPORTAÇÕES DO GRÁFICO (ng2-charts / Chart.js)
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Registra os dados de localidade na aplicação ANTES da configuração
registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    
    // 👉 O ANGULAR AGORA RODA OS DOIS EM SEQUÊNCIA:
    provideHttpClient(
      withInterceptors([jwtInterceptor, anoInterceptor])
    ),
    
    // Informa ao Angular que o idioma padrão do sistema é pt-BR
    { provide: LOCALE_ID, useValue: 'pt-BR' },

    // 👉 PROVEDOR DOS GRÁFICOS (Habilita o Chart.js em toda a aplicação)
    provideCharts(withDefaultRegisterables())
  ],
};