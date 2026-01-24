import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/config/api-urls';

/**
 * User API Service - handles all HTTP communication with user endpoints
 * Responsibility: Only API calls, no business logic or caching
 */
@Injectable({
  providedIn: 'root'
})
export class UserApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Get all users from API
   */
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.USERS_URL}/all`);
  }

  /**
   * Get user by ID from API
   */
  getUserById(userId: number): Observable<any> {
    console.log(`${this.apiUrls.USERS_URL}/${userId}`)
    console.log('Fetching user with ID:', userId);
    return this.http.get<any>(`${this.apiUrls.USERS_URL}/${userId}`);
  }

  /**
   * Get user instruments and ratings
   */
  getUserInstrumentsAndRatings(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}?userId=${userId}`);
  }

  /**
   * Update user data
   */
  updateUser(userId: number, data: {
    name: string;
    email: string;
    password?: string;
    bio?: string;
    favouriteGenreIds: number[];
  }): Observable<any> {
    return this.http.patch(`${this.apiUrls.USERS_URL}/update/${userId}`, data);
  }

  /**
   * Update user profile image
   */
  updateUserImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.apiUrls.IMAGE_URL}/profile-picture`, formData, {});
  }
}
