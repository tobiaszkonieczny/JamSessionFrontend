import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/config/api-urls';

/**
 * Instruments and Ratings API Service - handles HTTP communication
 * Responsibility: Only API calls for instrument ratings
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentsAndRatingsApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Add multiple instrument ratings for a user
   */
  addInstrumentsAndRatings(data: Array<{
    userId: number;
    instrumentId: number;
    rating: number;
  }>): Observable<any> {
    return this.http.post(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}/batch`, data);
  }

  /**
   * Delete an instrument rating
   */
  deleteInstrumentAndRating(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}?id=${id}`);
  }

  /**
   * Get instrument ratings for a user
   */
  getUserInstrumentRatings(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}?userId=${userId}`);
  }

  /**
   * TODO: Add update rating endpoint
   */
  // updateInstrumentRating(id: number, rating: number): Observable<any> {
  //   return this.http.patch(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}/${id}`, { rating });
  // }
}
