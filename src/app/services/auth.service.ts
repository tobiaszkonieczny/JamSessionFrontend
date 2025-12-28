import {inject, Injectable, signal} from '@angular/core';
import {API_URLS} from '../config/api-urls';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {jwtDecode, JwtPayload} from 'jwt-decode';
import {UserService} from './user.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {JwtPayload as CustomJwtPayload} from '../model/JwtPayload';
import { UserType } from '../model/user.type';

@Injectable({
  providedIn: 'root'
})
export class AuthService {


  isLoggedIn$ = new BehaviorSubject<boolean>(false);
  isAdmin = signal<boolean>(false);
  currentUser = signal<UserType | null>(null);
  private readonly ROLE_ADMIN_NAME = 'ROLE_ADMIN';
  private apiUrls = API_URLS;
  private tokenExpirationTimer: any;
  private _snackBar = inject(MatSnackBar);

  constructor(private http: HttpClient, private userService: UserService, private router: Router) {
  }


  login(mail: any, pass: any): Observable<any> {
    return this.http.post(`${this.apiUrls.AUTH_URL}/login`, {
      email: mail,
      password: pass,
    }, {responseType: 'text'})
  }

  loggedIn() {
    this.isLoggedIn$.next(true);
    this.checkAdminStatus();
  }

  loggedOut() {
    this.isLoggedIn$.next(false);
    this.isAdmin.set(false);
  }

  checkAdminStatus(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isAdmin.set(false);
      return;
    }
    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const hasAdminRole = decodedToken.roles?.includes(this.ROLE_ADMIN_NAME) || false;
      this.isAdmin.set(hasAdminRole);
    } catch (error) {
      this.isAdmin.set(false);
    }
  }

  getCurrentUser(): UserType | null {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const userId = decodedToken['sub'];
      if (this.currentUser() && this.currentUser()!.id === +userId!) {
        return this.currentUser();
      }
      this.userService.getUserById(+userId!).subscribe({
        next: (user) => {
          this.currentUser.set(user);
        },
        error: () => {
          this.currentUser.set(null);
        }
      });
      return this.currentUser();
    } catch (error) {
      return null;
    }
  }

  autoLogout(decodedToken: JwtPayload): void {
    const expirationDate = +(decodedToken['exp'])!;
    const userId = decodedToken['sub'];
    const expirationDuration =
      new Date(expirationDate * 1000).getTime() - new Date().getTime();
    console.log(expirationDuration);
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout(+(userId!));
    }, expirationDuration);
    console.log(this.tokenExpirationTimer);
  }

  logout(userId: number): void {
    this._snackBar.open("Session has expired", "OK!");
    localStorage.removeItem('token')
    this.userService.clearUserCache(userId);
    this.isAdmin.set(false);
    this.loggedOut();
    this.router.navigate(['/login'])
  }
}
