import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, of } from 'rxjs';
import { AdminApiService } from '../api/admin-api.service';
import { MusicGenre } from '../../../shared/model/user.type';
import { Instrument } from '../../jam-session/model/jamSession.type';

/**
 * Admin Domain Service - manages admin operations and state
 * Responsibility: Business logic for admin operations, coordinating with other services
 * 
 * NOTE: Genre and Instrument caching should be handled by MusicGenresDomainService and InstrumentsDomainService
 * This service only handles CRUD operations and notifies other services to invalidate their caches
 */
@Injectable({
  providedIn: 'root'
})
export class AdminDomainService {
  private readonly adminApiService = inject(AdminApiService);

  // Operation states
  readonly isAddingGenre = signal<boolean>(false);
  readonly isRemovingGenre = signal<boolean>(false);
  readonly isAddingInstrument = signal<boolean>(false);
  readonly isRemovingInstrument = signal<boolean>(false);

  // Success/error messages
  readonly lastOperationResult = signal<{ success: boolean; message: string } | null>(null);

  /**
   * Add new music genre
   * NOTE: MusicGenresDomainService should be notified to clear its cache
   */
  addGenre(genreName: string): Observable<any> {
    this.isAddingGenre.set(true);
    this.lastOperationResult.set(null);

    return this.adminApiService.addGenre(genreName).pipe(
      tap(() => {
        this.isAddingGenre.set(false);
        this.lastOperationResult.set({ 
          success: true, 
          message: `Genre "${genreName}" added successfully` 
        });
        // TODO: Notify MusicGenresDomainService to clear cache
        // Consider using an event bus or service locator pattern to avoid circular dependencies
      }),
      catchError(error => {
        this.isAddingGenre.set(false);
        this.lastOperationResult.set({ 
          success: false, 
          message: `Failed to add genre: ${error.message}` 
        });
        throw error;
      })
    );
  }

  /**
   * Remove music genre
   * NOTE: MusicGenresDomainService should be notified to clear its cache
   */
  removeGenre(id: number): Observable<string> {
    this.isRemovingGenre.set(true);
    this.lastOperationResult.set(null);

    return this.adminApiService.removeGenre(id).pipe(
      tap(() => {
        this.isRemovingGenre.set(false);
        this.lastOperationResult.set({ 
          success: true, 
          message: 'Genre removed successfully' 
        });
        // TODO: Notify MusicGenresDomainService to clear cache
      }),
      catchError(error => {
        this.isRemovingGenre.set(false);
        this.lastOperationResult.set({ 
          success: false, 
          message: `Failed to remove genre: ${error.message}` 
        });
        throw error;
      })
    );
  }

  /**
   * Add new instrument
   * NOTE: InstrumentsDomainService should be notified to clear its cache
   */
  addInstrument(instrumentName: string): Observable<any> {
    this.isAddingInstrument.set(true);
    this.lastOperationResult.set(null);

    return this.adminApiService.addInstrument(instrumentName).pipe(
      tap(() => {
        this.isAddingInstrument.set(false);
        this.lastOperationResult.set({ 
          success: true, 
          message: `Instrument "${instrumentName}" added successfully` 
        });
        // TODO: Notify InstrumentsDomainService to clear cache
      }),
      catchError(error => {
        this.isAddingInstrument.set(false);
        this.lastOperationResult.set({ 
          success: false, 
          message: `Failed to add instrument: ${error.message}` 
        });
        throw error;
      })
    );
  }

  /**
   * Remove instrument
   * NOTE: InstrumentsDomainService should be notified to clear its cache
   */
  removeInstrument(id: number): Observable<string> {
    this.isRemovingInstrument.set(true);
    this.lastOperationResult.set(null);

    return this.adminApiService.removeInstrument(id).pipe(
      tap(() => {
        this.isRemovingInstrument.set(false);
        this.lastOperationResult.set({ 
          success: true, 
          message: 'Instrument removed successfully' 
        });
        // TODO: Notify InstrumentsDomainService to clear cache
      }),
      catchError(error => {
        this.isRemovingInstrument.set(false);
        this.lastOperationResult.set({ 
          success: false, 
          message: `Failed to remove instrument: ${error.message}` 
        });
        throw error;
      })
    );
  }

  /**
   * Get all genres (delegates to API, no caching here)
   * Use MusicGenresDomainService for cached access
   */
  getAllGenres(): Observable<any[]> {
    return this.adminApiService.getAllGenres();
  }

  /**
   * Get all instruments (delegates to API, no caching here)
   * Use InstrumentsDomainService for cached access
   */
  getAllInstruments(): Observable<any[]> {
    return this.adminApiService.getAllInstruments();
  }

  /**
   * Clear last operation result
   */
  clearOperationResult(): void {
    this.lastOperationResult.set(null);
  }
}
