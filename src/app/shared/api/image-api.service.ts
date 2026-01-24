import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../core/config/api-urls';

/**
 * Image API Service - handles HTTP communication for images
 * Responsibility: Only API calls for image operations
 */
@Injectable({
  providedIn: 'root'
})
export class ImageApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Get image as blob
   */
  getImage(imagePath: string | number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrls.BASE_URL}/${imagePath}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  /**
   * Upload profile picture
   */
  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrls.IMAGE_URL}/profile-picture`, formData);
  }

  /**
   * TODO: Add delete image endpoint if needed
   */
  // deleteImage(imageId: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrls.IMAGE_URL}/${imageId}`);
  // }
}
