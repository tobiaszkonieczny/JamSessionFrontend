import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay } from 'rxjs';
import { API_URLS } from '../config/api-urls';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private apiUrls = API_URLS;
  private imageCache = new Map<string, Observable<string>>();

  constructor(private http: HttpClient) {}

  /**
   * Load image from backend and convert to base64 data URL for display
   * Uses caching to avoid redundant requests
   */
  getImageAsDataUrl(imagePath: string | number): Observable<string> {
    const cacheKey = String(imagePath);
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    const imageUrl$ = new Observable<string>(observer => {
      this.http.get(`${this.apiUrls.BASE_URL}/${imagePath}`, { 
        responseType: 'blob',
        observe: 'response'
      }).subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            observer.error('No image data received');
            return;
          }

          // Convert blob to base64 data URL
          const reader = new FileReader();
          reader.onloadend = () => {
            observer.next(reader.result as string);
            observer.complete();
          };
          reader.onerror = () => {
            observer.error('Failed to read image');
          };
          reader.readAsDataURL(blob);
        },
        error: (err) => {
          observer.error(err);
        }
      });
    }).pipe(
      shareReplay(1) // Cache the result
    );

    this.imageCache.set(cacheKey, imageUrl$);
    return imageUrl$;
  }

  /**
   * Preload multiple images
   */
  preloadImages(imageIds: (string | number)[]): void {
    imageIds.forEach(id => {
      if (id) {
        this.getImageAsDataUrl(id).subscribe();
      }
    });
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
  }
}
