import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/config/api-urls';

/**
 * Instruments API Service - handles HTTP communication for instruments
 * Responsibility: Only API calls
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentsApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Get all instruments
   */
  getAllInstruments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.INSTRUMENTS_URL}/all`);
  }
}
