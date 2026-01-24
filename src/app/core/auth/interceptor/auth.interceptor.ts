import {HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import { AuthDomainService } from '../services/auth-domain.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authDomain = inject(AuthDomainService);
  const token = authDomain.getToken();
  
  if (token && authDomain.isTokenValid(token)) {
    const newReq = req.clone({
      headers: req.headers.append('Authorization', `Bearer ${token}`)
    });
    return next(newReq);
  }
  
  return next(req);
}
