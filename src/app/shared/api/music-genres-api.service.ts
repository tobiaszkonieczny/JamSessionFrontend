import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/config/api-urls';

/**
 * Music Genres API Service - handles HTTP communication for music genres
 * Responsibility: Only API calls
 */
@Injectable({
  providedIn: 'root'
})
export class MusicGenresApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Get all music genres
   */
  getAllGenres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.MUSIC_GENRES_URL}/all`);
  }
}
