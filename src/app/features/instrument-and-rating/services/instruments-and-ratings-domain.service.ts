import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { InstrumentsAndRatingsApiService } from '../api/instruments-and-ratings-api.service';
import { InstrumentsAndRating } from '../../../shared/model/user.type';

/**
 * Instruments and Ratings Domain Service - manages user instrument ratings
 * Responsibility: Business logic for instrument ratings
 * 
 * NOTE: User instrument ratings caching should be handled by UserDomainService
 * This service only handles CRUD operations and notifies UserDomainService to refresh data
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentsAndRatingsDomainService {
  private readonly instrumentsAndRatingsApiService = inject(InstrumentsAndRatingsApiService);

  // Operation states
  readonly isAddingRatings = signal<boolean>(false);
  readonly isDeletingRating = signal<boolean>(false);

  /**
   * Add multiple instrument ratings for a user
   * NOTE: UserDomainService should be notified to clear user cache after this operation
   */
  addInstrumentsAndRatings(userId: number, ratings: InstrumentsAndRating[]): Observable<any> {
    this.isAddingRatings.set(true);

    // Filter to only include necessary fields and ensure all values are defined
    const filteredData = ratings
      .filter(r => r.userId && r.instrumentId && r.rating !== undefined)
      .map(({ userId, instrumentId, rating }) => ({
        userId: userId!,
        instrumentId: instrumentId!,
        rating: rating!
      }));

    return this.instrumentsAndRatingsApiService.addInstrumentsAndRatings(filteredData).pipe(
      tap(() => {
        this.isAddingRatings.set(false);
        // TODO: Notify UserDomainService to clear user cache
        // Consider using an event bus or service locator pattern to avoid circular dependencies
        console.log(`Instrument ratings added for user ${userId}. User cache should be refreshed.`);
      }),
      catchError(error => {
        this.isAddingRatings.set(false);
        console.error('Error adding instrument ratings:', error);
        throw error;
      })
    );
  }

  /**
   * Delete an instrument rating
   * NOTE: UserDomainService should be notified to clear user cache after this operation
   */
  deleteInstrumentAndRating(id: number, userId?: number): Observable<any> {
    this.isDeletingRating.set(true);

    return this.instrumentsAndRatingsApiService.deleteInstrumentAndRating(id).pipe(
      tap(() => {
        this.isDeletingRating.set(false);
        // TODO: Notify UserDomainService to clear user cache
        if (userId) {
          console.log(`Instrument rating deleted for user ${userId}. User cache should be refreshed.`);
        }
      }),
      catchError(error => {
        this.isDeletingRating.set(false);
        console.error('Error deleting instrument rating:', error);
        throw error;
      })
    );
  }

  /**
   * Get user instrument ratings (delegates to API, no caching here)
   * Use UserDomainService for cached access
   */
  getUserInstrumentRatings(userId: number): Observable<any[]> {
    return this.instrumentsAndRatingsApiService.getUserInstrumentRatings(userId);
  }
}
