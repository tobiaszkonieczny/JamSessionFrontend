import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, withViewTransitions} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './interceptor/auth.interceptor';
import {errorInterceptor} from './interceptor/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync()
  ]
};
