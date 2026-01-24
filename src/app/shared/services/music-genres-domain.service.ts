import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, map, tap, catchError, shareReplay } from 'rxjs';
import { MusicGenresApiService } from '../api/music-genres-api.service';
import { MusicGenre } from '../model/user.type';

/**
 * Music Genres Domain Service - manages music genres data and caching
 * Responsibility: State management, caching, data transformation for music genres
 */
@Injectable({
  providedIn: 'root'
})
export class MusicGenresDomainService {
  private readonly musicGenresApiService = inject(MusicGenresApiService);

  // Cache management
  private genresCache = signal<MusicGenre[]>([]);
  private genresCacheValid = signal<boolean>(false);
  private genresRequest$: Observable<MusicGenre[]> | null = null;

  // Loading state
  readonly isLoadingGenres = signal<boolean>(false);

  // Computed signals
  readonly genres = computed(() => this.genresCache());
  readonly hasGenres = computed(() => this.genresCache().length > 0);

  /**
   * Get all music genres with caching
   * Uses shareReplay to ensure only one HTTP request for multiple subscribers
   */
  getAllGenres(forceRefresh: boolean = false): Observable<MusicGenre[]> {
    if (this.genresCacheValid() && !forceRefresh) {
      return of(this.genresCache());
    }

    if (this.genresRequest$ && !forceRefresh) {
      return this.genresRequest$;
    }

    this.isLoadingGenres.set(true);

    this.genresRequest$ = this.musicGenresApiService.getAllGenres().pipe(
      map(genres => this.mapToMusicGenres(genres)),
      tap(genres => {
        this.genresCache.set(genres);
        this.genresCacheValid.set(true);
        this.isLoadingGenres.set(false);
        this.genresRequest$ = null;
      }),
      shareReplay(1),
      catchError(err => {
        console.error('Error fetching music genres:', err);
        this.isLoadingGenres.set(false);
        this.genresRequest$ = null;
        return of([]);
      })
    );

    return this.genresRequest$;
  }

  /**
   * Get genre by ID from cache
   */
  getGenreById(id: number): MusicGenre | undefined {
    return this.genresCache().find(g => g.id === id);
  }

  /**
   * Clear cache (should be called after admin adds/removes genres)
   */
  clearCache(): void {
    this.genresCacheValid.set(false);
    this.genresCache.set([]);
    this.genresRequest$ = null;
  }

  /**
   * Preload genres (useful on app startup)
   */
  preloadGenres(): void {
    if (!this.genresCacheValid()) {
      this.getAllGenres().subscribe();
    }
  }

  // Data transformation
  private mapToMusicGenres(json: any[]): MusicGenre[] {
    if (!Array.isArray(json)) return [];
    
    return json.map(genre => ({
      id: genre.id,
      name: genre.name
    }));
  }
}
