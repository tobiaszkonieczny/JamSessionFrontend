import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, forkJoin, catchError, map, shareReplay, tap, switchMap } from 'rxjs';
import { UserApiService } from '../api/user-api.service';
import { UserType, InstrumentsAndRating } from '../../../shared/model/user.type';

/**
 * User Domain Service - manages user business logic and caching
 * Responsibility: State management, caching, data transformation
 */
@Injectable({
  providedIn: 'root'
})
export class UserDomainService {
  private readonly userApiService = inject(UserApiService);

  // Cache management
  private userCache = new Map<number, Observable<UserType>>();
  private allUsersCache = signal<UserType[]>([]);
  private allUsersCacheValid = signal<boolean>(false);

  // Loading states
  readonly isLoadingAllUsers = signal<boolean>(false);
  readonly isLoadingUser = signal<number | null>(null);

  /**
   * Get all users with their instruments and ratings
   * Uses caching to avoid unnecessary API calls
   */
  getAllUsers(forceRefresh: boolean = false): Observable<UserType[]> {
    if (this.allUsersCacheValid() && !forceRefresh) {
      return of(this.allUsersCache());
    }

    this.isLoadingAllUsers.set(true);

    return this.userApiService.getAllUsers().pipe(
      map(users => users.map(this.mapToUser)),
      map(users => {
        if (users.length === 0) {
          return of([]);
        }

        // Fetch instruments and ratings for each user in parallel
        const userRequests = users.map(user =>
          this.userApiService.getUserInstrumentsAndRatings(user.id!).pipe(
            map(this.mapToInstrumentsAndRatings),
            map(instrumentsAndRatings => ({ ...user, instrumentsAndRatings })),
            catchError(err => {
              console.error(`Error fetching instruments for user ${user.id}:`, err);
              return of({ ...user, instrumentsAndRatings: [] } as UserType);
            })
          )
        );

        return forkJoin(userRequests);
      }),
      switchMap(observable => observable),
      tap(users => {
        this.allUsersCache.set(users);
        this.allUsersCacheValid.set(true);
        this.isLoadingAllUsers.set(false);
      }),
      catchError(err => {
        console.error('Error fetching all users:', err);
        this.isLoadingAllUsers.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get user by ID with caching
   * Each user is cached separately for efficiency
   */
  getUserById(userId: number, forceRefresh: boolean = false): Observable<UserType> {
    if (!forceRefresh && this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }

    this.isLoadingUser.set(userId);

    const request$ = this.userApiService.getUserById(userId).pipe(
      map(this.mapToUser),
      switchMap(user =>
        this.userApiService.getUserInstrumentsAndRatings(userId).pipe(
          map(this.mapToInstrumentsAndRatings),
          map(instrumentsAndRatings => ({ ...user, instrumentsAndRatings })),
          catchError(err => {
            console.error('Error fetching user instruments:', err);
            return of({ ...user, instrumentsAndRatings: [] } as UserType);
          })
        )
      ),
      shareReplay(1),
      tap(() => this.isLoadingUser.set(null)),
      catchError(err => {
        console.error('Error fetching user:', err);
        this.isLoadingUser.set(null);
        return of(this.getEmptyUser());
      })
    );

    this.userCache.set(userId, request$);
    return request$;
  }

  /**
   * Update user data
   * Clears cache after successful update
   */
  updateUser(userId: number, formValue: {
    name: string;
    email: string;
    password?: string;
    bio?: string;
    genres: number[];
  }): Observable<any> {
    return this.userApiService.updateUser(userId, {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      bio: formValue.bio,
      favouriteGenreIds: formValue.genres
    }).pipe(
      tap(() => {
        this.clearUserCache(userId);
        this.invalidateAllUsersCache();
      })
    );
  }

  /**
   * Update user profile image
   * Clears cache after successful update
   */
  updateUserImage(userId: number, image: File): Observable<any> {
    return this.userApiService.updateUserImage(image).pipe(
      tap(() => {
        this.clearUserCache(userId);
        this.invalidateAllUsersCache();
      })
    );
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId: number): void {
    this.userCache.delete(userId);
  }

  /**
   * Invalidate all users cache
   * Call this when users list might have changed
   */
  invalidateAllUsersCache(): void {
    this.allUsersCacheValid.set(false);
    this.allUsersCache.set([]);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.userCache.clear();
    this.invalidateAllUsersCache();
  }

  // Helper methods for data transformation
  private mapToUser(json: any): UserType {
    return {
      id: json.id,
      name: json.name,
      email: json.email,
      bio: json.bio,
      profilePictureId: json.profilePictureId,
      musicGenres: json.favoriteGenres || [],
      instrumentsAndRatings: []
    };
  }

  private mapToInstrumentsAndRatings(json: any): InstrumentsAndRating[] {
    if (!Array.isArray(json)) return [];
    
    return json.map((item: any) => ({
      instrumentsAndRatingsId: item.id,
      rating: item.rating,
      instrumentId: item.instrumentId,
      instrumentName: item.instrumentName || item.name,
      userId: item.userId,
      name: item.name || item.instrumentName
    }));
  }

  private getEmptyUser(): UserType {
    return {
      id: 0,
      name: '',
      email: '',
      bio: '',
      profilePictureId: undefined,
      musicGenres: [],
      instrumentsAndRatings: []
    };
  }
}
