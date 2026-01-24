import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {inject} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {

  const _snackBar = inject(MatSnackBar);
  const router = inject(Router);


  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log("ERROR INTERCEPT", error);

      if (!navigator.onLine) {
        _snackBar.open('No internet connection', "OK");
        router.navigate(['']);
      } else if (error.status === 0) {
        _snackBar.open('Cannot connect to the server', "OK");
        router.navigate(['']);
      } else if (error.status === 500) {
        _snackBar.open('Server Error. Please try again later.', "OK");
        router.navigate(['']);
      }
      
      return throwError(() => error);
    })
  )
};
