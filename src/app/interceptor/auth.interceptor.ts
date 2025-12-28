import {HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {jwtDecode} from 'jwt-decode';
import {JwtPayload} from '../model/JwtPayload';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  console.log("intercepting")

  const token = localStorage.getItem('token');
  const authService = inject(AuthService);
  if(token){

    const currentTime = Math.floor(Date.now() / 1000);
    const decodedToken = jwtDecode<JwtPayload>(token);
    if(decodedToken.exp<currentTime){
      authService.logout(+(decodedToken.sub))
    }

    const newReq = req.clone({
      headers: req.headers.append('Authorization', `Bearer ${token}`)
    });
    return next(newReq)
  }
  else{
    return next(req)
  }

}
