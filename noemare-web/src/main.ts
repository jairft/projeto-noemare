import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// Importante: verifique se o nome do seu ficheiro é app.ts ou app.component.ts
// Se o seu ficheiro for app.ts, mude aqui para './app/app'
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
