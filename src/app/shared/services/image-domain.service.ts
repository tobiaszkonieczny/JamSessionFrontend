import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { ImageApiService } from '../api/image-api.service';

/**
 * Image Domain Service - manages image loading and caching
 * Responsibility: Image caching, blob to data URL conversion
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private readonly imageApiService = inject(ImageApiService);
  private imageCache = new Map<string, Observable<string>>();

  // Loading states
  readonly loadingImages = signal<Set<string>>(new Set());

  /**
   * Load image from backend and convert to base64 data URL for display
   * Uses caching to avoid redundant requests
   */
  getImageAsDataUrl(imagePath: string | number): Observable<string> {
    console.log('Requesting image at path:', imagePath);
    const cacheKey = String(imagePath);
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    this.addLoadingImage(cacheKey);

    const imageUrl$ = new Observable<string>(observer => {
      this.imageApiService.getImage(imagePath).subscribe({
        next: (response) => {
          const blob = response.body;
          if (!blob) {
            observer.error('No image data received');
            this.removeLoadingImage(cacheKey);
            return;
          }

          // Convert blob to base64 data URL
          const reader = new FileReader();
          reader.onloadend = () => {
            observer.next(reader.result as string);
            observer.complete();
            this.removeLoadingImage(cacheKey);
          };
          reader.onerror = () => {
            observer.error('Failed to read image');
            this.removeLoadingImage(cacheKey);
          };
          reader.readAsDataURL(blob);
        },
        error: (err) => {
          console.error('Error loading image:', err);
          observer.error(err);
          this.removeLoadingImage(cacheKey);
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
        this.getImageAsDataUrl(id).subscribe({
          error: (err) => console.error(`Failed to preload image ${id}:`, err)
        });
      }
    });
  }

  /**
   * Clear specific image from cache
   */
  clearImageCache(imagePath: string | number): void {
    const cacheKey = String(imagePath);
    this.imageCache.delete(cacheKey);
  }

  /**
   * Clear all image cache
   */
  clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * Check if image is currently loading
   */
  isImageLoading(imagePath: string | number): boolean {
    return this.loadingImages().has(String(imagePath));
  }

  private addLoadingImage(cacheKey: string): void {
    const current = this.loadingImages();
    current.add(cacheKey);
    this.loadingImages.set(new Set(current));
  }

  private removeLoadingImage(cacheKey: string): void {
    const current = this.loadingImages();
    current.delete(cacheKey);
    this.loadingImages.set(new Set(current));
  }
}
