import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../config/api-urls';

/**
 * Auth API Service - handles all HTTP communication with authentication endpoints
 * Responsibility: Only API calls, no business logic
 */
@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Login user with email and password
   * @returns JWT token as text
   */
  login(email: string, password: string): Observable<string> {
    return this.http.post(
      `${this.apiUrls.AUTH_URL}/login`,
      { email, password },
      { responseType: 'text' }
    );
  }

  /**
   * Register new user
   * @returns Success message or user details
   */
  register(email: string, name: string, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrls.USERS_URL}/register`,
      { email, name, password }
    );
  }

  /**
   * TODO: Implement logout endpoint on backend if needed
   * For now logout is handled client-side only
   */
  // logout(): Observable<void> {
  //   return this.http.post<void>(`${this.apiUrls.AUTH_URL}/logout`, {});
  // }

  /**
   * TODO: Add register endpoint
   */
  // register(email: string, password: string, name: string): Observable<string> {
  //   return this.http.post(
  //     `${this.apiUrls.AUTH_URL}/register`,
  //     { email, password, name },
  //     { responseType: 'text' }
  //   );
  // }

  /**
   * TODO: Add refresh token endpoint
   */
  // refreshToken(refreshToken: string): Observable<string> {
  //   return this.http.post(
  //     `${this.apiUrls.AUTH_URL}/refresh`,
  //     { refreshToken },
  //     { responseType: 'text' }
  //   );
  // }
}
