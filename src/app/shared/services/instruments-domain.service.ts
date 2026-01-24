import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, map, tap, catchError, shareReplay } from 'rxjs';
import { InstrumentsApiService } from '../api/instruments-api.service';
import { Instrument } from '../../features/jam-session/model/jamSession.type';

/**
 * Instruments Domain Service - manages instruments data and caching
 * Responsibility: State management, caching, data transformation for instruments
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentsDomainService {
  private readonly instrumentsApiService = inject(InstrumentsApiService);

  // Cache management
  private instrumentsCache = signal<Instrument[]>([]);
  private instrumentsCacheValid = signal<boolean>(false);
  private instrumentsRequest$: Observable<Instrument[]> | null = null;

  // Loading state
  readonly isLoadingInstruments = signal<boolean>(false);

  // Computed signals
  readonly instruments = computed(() => this.instrumentsCache());
  readonly hasInstruments = computed(() => this.instrumentsCache().length > 0);

  /**
   * Get all instruments with caching
   * Uses shareReplay to ensure only one HTTP request for multiple subscribers
   */
  getAllInstruments(forceRefresh: boolean = false): Observable<Instrument[]> {
    if (this.instrumentsCacheValid() && !forceRefresh) {
      return of(this.instrumentsCache());
    }

    if (this.instrumentsRequest$ && !forceRefresh) {
      return this.instrumentsRequest$;
    }

    this.isLoadingInstruments.set(true);

    this.instrumentsRequest$ = this.instrumentsApiService.getAllInstruments().pipe(
      map(instruments => this.mapToInstruments(instruments)),
      tap(instruments => {
        this.instrumentsCache.set(instruments);
        this.instrumentsCacheValid.set(true);
        this.isLoadingInstruments.set(false);
        this.instrumentsRequest$ = null;
      }),
      shareReplay(1),
      catchError(err => {
        console.error('Error fetching instruments:', err);
        this.isLoadingInstruments.set(false);
        this.instrumentsRequest$ = null;
        return of([]);
      })
    );

    return this.instrumentsRequest$;
  }

  /**
   * Get instrument by ID from cache
   */
  getInstrumentById(id: number): Instrument | undefined {
    return this.instrumentsCache().find(i => i.id === id);
  }

  /**
   * Clear cache (should be called after admin adds/removes instruments)
   */
  clearCache(): void {
    this.instrumentsCacheValid.set(false);
    this.instrumentsCache.set([]);
    this.instrumentsRequest$ = null;
  }

  /**
   * Preload instruments (useful on app startup)
   */
  preloadInstruments(): void {
    if (!this.instrumentsCacheValid()) {
      this.getAllInstruments().subscribe();
    }
  }

  // Data transformation
  private mapToInstruments(json: any[]): Instrument[] {
    if (!Array.isArray(json)) return [];
    
    return json.map(item => ({
      id: item.id,
      name: item.name
    }));
  }
}
