import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/config/api-urls';

/**
 * Admin API Service - handles all HTTP communication with admin endpoints
 * Responsibility: Only API calls for admin operations
 */
@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  // Genre operations
  getAllGenres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.MUSIC_GENRES_URL}/all`);
  }

  addGenre(genreName: string): Observable<any> {
    return this.http.post(`${this.apiUrls.MUSIC_GENRES_URL}/create`, { name: genreName });
  }

  removeGenre(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrls.MUSIC_GENRES_URL}/delete?id=${id}`, { 
      responseType: 'text' 
    });
  }

  // Instrument operations
  getAllInstruments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.INSTRUMENTS_URL}/all`);
  }

  addInstrument(instrumentName: string): Observable<any> {
    return this.http.post(`${this.apiUrls.INSTRUMENTS_URL}/new`, { name: instrumentName });
  }

  removeInstrument(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrls.INSTRUMENTS_URL}/delete?id=${id}`, { 
      responseType: 'text' 
    });
  }

  /**
   * TODO: Add user management endpoints
   * - Ban/unban user
   * - Delete user
   * - Get user statistics
   */

  /**
   * TODO: Add jam session management endpoints
   * - Delete any jam session (admin override)
   * - Get jam session statistics
   */
}
