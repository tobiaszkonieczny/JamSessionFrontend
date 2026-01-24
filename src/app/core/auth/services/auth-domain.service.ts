import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthApiService } from '../api/auth-api.service';
import { JwtPayload as CustomJwtPayload } from '../../../shared/model/JwtPayload';
import { UserType } from '../../../shared/model/user.type';

/**
 * Auth Domain Service - manages authentication state and business logic
 * Responsibility: State management, token handling, user session
 * 
 * NOTE: This service depends on UserDomainService which should be injected lazily
 * to avoid circular dependencies. UserDomainService should be in a separate module.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthDomainService {
  private readonly ROLE_ADMIN_NAME = 'ROLE_ADMIN';
  private readonly TOKEN_KEY = 'token';
  
  private readonly authApiService = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // State management with signals
  readonly isLoggedIn = signal<boolean>(false);
  readonly isAdmin = signal<boolean>(false);
  readonly currentUser = signal<UserType | null>(null);
  readonly currentUserId = signal<number | null>(null);
  
  // Computed signals
  readonly isAuthenticated = computed(() => this.isLoggedIn());
  readonly hasAdminRole = computed(() => this.isAdmin());

  private tokenExpirationTimer: any;

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Initialize auth state from stored token on app startup
   */
  private initializeAuthState(): void {
    const token = this.getTokenInternal();
    if (token && this.isTokenValid(token)) {
      this.isLoggedIn.set(true);
      this.checkAdminStatus();
      this.loadCurrentUser();
      
      const decodedToken = jwtDecode<JwtPayload>(token);
      this.autoLogout(decodedToken);
    } else {
      this.clearAuthState();
    }
  }

  /**
   * Login user with email and password
   */
  login(email: string, password: string): Observable<string> {
    return this.authApiService.login(email, password).pipe(
      tap(token => {
        this.handleSuccessfulLogin(token);
      }),
      catchError(error => {
        this.snackBar.open('Login failed. Please check your credentials.', 'OK', {
          duration: 3000
        });
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle successful login - store token and update state
   */
  private handleSuccessfulLogin(token: string): void {
    this.storeToken(token);
    this.isLoggedIn.set(true);
    this.checkAdminStatus();
    this.loadCurrentUser();
    
    const decodedToken = jwtDecode<JwtPayload>(token);
    this.autoLogout(decodedToken);
  }

  /**
   * Logout user and clear all auth state
   */
  logout(showMessage: boolean = true): void {
    const userId = this.currentUserId();
    
    if (showMessage) {
      this.snackBar.open('You have been logged out', 'OK', {
        duration: 3000
      });
    }
    
    this.clearToken();
    this.clearAuthState();
    
    // TODO: UserDomainService should handle user cache clearing
    // This creates a circular dependency. Consider using an event bus or service locator pattern
    // if (userId) {
    //   this.userDomainService.clearUserCache(userId);
    // }
    
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    
    this.router.navigate(['/login']);
  }

  /**
   * Check if current user has admin role
   */
  private checkAdminStatus(): void {
    const token = this.getTokenInternal();
    if (!token) {
      this.isAdmin.set(false);
      return;
    }

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const hasAdminRole = decodedToken.roles?.includes(this.ROLE_ADMIN_NAME) || false;
      this.isAdmin.set(hasAdminRole);
    } catch (error) {
      console.error('Error decoding token:', error);
      this.isAdmin.set(false);
    }
  }

  /**
   * Load current user data from token
   */
  private loadCurrentUser(): void {
    const token = this.getTokenInternal();
    if (!token) {
      this.currentUser.set(null);
      this.currentUserId.set(null);
      return;
    }

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const userId = decodedToken['sub'];
      
      if (!userId) {
        this.currentUser.set(null);
        this.currentUserId.set(null);
        return;
      }

      this.currentUserId.set(+userId);

      // TODO: Load user data from UserDomainService
      // This creates a circular dependency. Consider lazy injection or event-based approach
      // this.userDomainService.getUserById(+userId).subscribe({
      //   next: (user: UserType) => {
      //     this.currentUser.set(user);
      //   },
      //   error: (error: any) => {
      //     console.error('Error loading current user:', error);
      //     this.currentUser.set(null);
      //   }
      // });
    } catch (error) {
      console.error('Error decoding token:', error);
      this.currentUser.set(null);
      this.currentUserId.set(null);
    }
  }

  /**
   * Get current user (returns signal value)
   */
  getCurrentUser(): UserType | null {
    return this.currentUser();
  }

  /**
   * Get current user ID from token
   */
  getCurrentUserId(): number | null {
    const token = this.getTokenInternal();
    if (!token) return null;

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const userId = decodedToken['sub'];
      return userId ? +userId : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Setup auto logout timer based on token expiration
   */
  private autoLogout(decodedToken: JwtPayload): void {
    const expirationDate = +(decodedToken['exp'])!;
    const expirationDuration = new Date(expirationDate * 1000).getTime() - new Date().getTime();

    if (expirationDuration <= 0) {
      this.logout(false);
      this.snackBar.open('Session has expired', 'OK', {
        duration: 3000
      });
      return;
    }

    this.tokenExpirationTimer = setTimeout(() => {
      this.snackBar.open('Session has expired', 'OK', {
        duration: 3000
      });
      this.logout(false);
    }, expirationDuration);
  }

  /**
   * Check if token is still valid
   */
  isTokenValid(token: string): boolean {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const expirationDate = +(decodedToken['exp'])!;
      const currentTime = new Date().getTime() / 1000;
      return expirationDate > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all auth state
   */
  private clearAuthState(): void {
    this.isLoggedIn.set(false);
    this.isAdmin.set(false);
    this.currentUser.set(null);
    this.currentUserId.set(null);
  }

  // Token management methods
  private getTokenInternal(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Get token for HTTP interceptors and external use
   */
  getToken(): string | null {
    return this.getTokenInternal();
  }

  /**
   * Get token for HTTP interceptors
   */
  getAuthToken(): string | null {
    return this.getTokenInternal();
  }

  /**
   * Refresh current user data
   */
  refreshCurrentUser(): void {
    this.loadCurrentUser();
  }
}
