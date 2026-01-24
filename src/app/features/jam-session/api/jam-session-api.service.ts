import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/config/api-urls';

/**
 * JamSession API Service - handles all HTTP communication with jam session endpoints
 * Responsibility: Only API calls, no business logic
 */
@Injectable({
  providedIn: 'root'
})
export class JamSessionApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Get all jam sessions
   */
  getAllJamSessions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.JAM_SESSIONS_URL}/all`);
  }

  /**
   * Get jam sessions owned by user
   */
  getOwnedJamSessions(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.JAM_SESSIONS_URL}/own/${userId}`);
  }

  /**
   * Get jam sessions user is signed up for
   */
  getSignedUpJamSessions(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.JAM_SESSIONS_URL}/signed-up/${userId}`);
  }

  /**
   * Get jam session by ID
   */
  getJamSessionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrls.JAM_SESSIONS_URL}/${id}`);
  }

  /**
   * Create new jam session
   */
  createJamSession(data: any): Observable<any> {
    return this.http.post(`${this.apiUrls.JAM_SESSIONS_URL}/create`, data);
  }

  /**
   * Edit jam session
   */
  editJamSession(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrls.JAM_SESSIONS_URL}/edit/${id}`, data);
  }

  /**
   * Delete jam session
   */
  deleteJamSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrls.JAM_SESSIONS_URL}/delete/${id}`);
  }

  /**
   * Join jam session
   */
  joinJamSession(jamSessionId: number, instrumentAndRatingId: number): Observable<any> {
    return this.http.post(`${this.apiUrls.JAM_SESSIONS_URL}/join/${jamSessionId}`, {
      instrumentAndRatingId
    });
  }

  /**
   * Leave jam session
   */
  leaveJamSession(jamSessionId: number, userId: number): Observable<string> {
    return this.http.delete(`${this.apiUrls.JAM_SESSIONS_URL}/leave/${jamSessionId}/${userId}`, { 
      responseType: 'text' 
    });
  }
}
