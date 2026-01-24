import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, map, tap, catchError, shareReplay } from 'rxjs';
import { JamSessionApiService } from '../api/jam-session-api.service';
import { JamSessionType, EditJamSessionDto, Instrument } from '../model/jamSession.type';
import { ShortUser, InstrumentsAndRating } from '../../../shared/model/user.type';

/**
 * JamSession Domain Service - manages jam session business logic and caching
 * Responsibility: State management, caching, data transformation
 */
@Injectable({
  providedIn: 'root'
})
export class JamSessionDomainService {
  private readonly jamSessionApiService = inject(JamSessionApiService);

  // Cache management
  private jamSessionCache = new Map<number, Observable<JamSessionType>>();
  private allJamSessionsCache = signal<JamSessionType[]>([]);
  private allJamSessionsCacheValid = signal<boolean>(false);
  private ownedJamSessionsCache = new Map<number, { sessions: JamSessionType[], valid: boolean }>();
  private signedUpJamSessionsCache = new Map<number, { sessions: JamSessionType[], valid: boolean }>();

  // Loading states
  readonly isLoadingAllJamSessions = signal<boolean>(false);
  readonly isLoadingJamSession = signal<number | null>(null);
  readonly isLoadingOwned = signal<boolean>(false);
  readonly isLoadingSignedUp = signal<boolean>(false);

  // Data signals
  readonly ownedJamSessions = signal<JamSessionType[]>([]);
  readonly signedUpJamSessions = signal<JamSessionType[]>([]);

  // Computed signals
  readonly hasJamSessions = computed(() => this.allJamSessionsCache().length > 0);

  /**
   * Get all jam sessions with caching
   */
  getAllJamSessions(forceRefresh: boolean = false): Observable<JamSessionType[]> {
    if (this.allJamSessionsCacheValid() && !forceRefresh) {
      return of(this.allJamSessionsCache());
    }

    this.isLoadingAllJamSessions.set(true);

    return this.jamSessionApiService.getAllJamSessions().pipe(
      map(sessions => this.mapToJamSessions(sessions)),
      tap(sessions => {
        this.allJamSessionsCache.set(sessions);
        this.allJamSessionsCacheValid.set(true);
        this.isLoadingAllJamSessions.set(false);
      }),
      catchError(err => {
        console.error('Error fetching all jam sessions:', err);
        this.isLoadingAllJamSessions.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get jam sessions owned by user
   */
  getOwnedJamSessions(userId: number, forceRefresh: boolean = false): Observable<JamSessionType[]> {
    const cached = this.ownedJamSessionsCache.get(userId);
    if (cached?.valid && !forceRefresh) {
      return of(cached.sessions);
    }

    this.isLoadingOwned.set(true);

    return this.jamSessionApiService.getOwnedJamSessions(userId).pipe(
      map(sessions => this.mapToJamSessions(sessions)),
      tap(sessions => {
        this.ownedJamSessionsCache.set(userId, { sessions, valid: true });
        this.isLoadingOwned.set(false);
      }),
      catchError(err => {
        console.error('Error fetching owned jam sessions:', err);
        this.isLoadingOwned.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get jam sessions user is signed up for
   */
  getSignedUpJamSessions(userId: number, forceRefresh: boolean = false): Observable<JamSessionType[]> {
    const cached = this.signedUpJamSessionsCache.get(userId);
    if (cached?.valid && !forceRefresh) {
      return of(cached.sessions);
    }

    this.isLoadingSignedUp.set(true);

    return this.jamSessionApiService.getSignedUpJamSessions(userId).pipe(
      map(sessions => this.mapToJamSessions(sessions)),
      tap(sessions => {
        this.signedUpJamSessionsCache.set(userId, { sessions, valid: true });
        this.isLoadingSignedUp.set(false);
      }),
      catchError(err => {
        console.error('Error fetching signed up jam sessions:', err);
        this.isLoadingSignedUp.set(false);
        return of([]);
      })
    );
  }

  /**
   * Load owned jam sessions and update signal
   */
  loadOwnedJamSessions(userId: number, forceRefresh: boolean = false): void {
    this.getOwnedJamSessions(userId, forceRefresh).subscribe({
      next: (sessions) => this.ownedJamSessions.set(sessions),
      error: () => this.ownedJamSessions.set([])
    });
  }

  /**
   * Load signed up jam sessions and update signal
   */
  loadSignedUpJamSessions(userId: number, forceRefresh: boolean = false): void {
    this.getSignedUpJamSessions(userId, forceRefresh).subscribe({
      next: (sessions) => this.signedUpJamSessions.set(sessions),
      error: () => this.signedUpJamSessions.set([])
    });
  }

  /**
   * Get jam session by ID with caching
   */
  getJamSessionById(id: number, forceRefresh: boolean = false): Observable<JamSessionType> {
    if (!forceRefresh && this.jamSessionCache.has(id)) {
      return this.jamSessionCache.get(id)!;
    }

    this.isLoadingJamSession.set(id);

    const request$ = this.jamSessionApiService.getJamSessionById(id).pipe(
      map(session => this.mapToSingleJamSession(session)),
      shareReplay(1),
      tap(() => this.isLoadingJamSession.set(null)),
      catchError(err => {
        console.error('Error fetching jam session:', err);
        this.isLoadingJamSession.set(null);
        throw err;
      })
    );

    this.jamSessionCache.set(id, request$);
    return request$;
  }

  /**
   * Create new jam session
   * Invalidates caches after successful creation
   */
  createJamSession(data: any): Observable<JamSessionType> {
    return this.jamSessionApiService.createJamSession(data).pipe(
      map(session => this.mapToSingleJamSession(session)),
      tap(() => {
        this.invalidateAllCaches();
      })
    );
  }

  /**
   * Edit jam session
   * Clears relevant caches after successful update
   */
  editJamSession(id: number, data: EditJamSessionDto): Observable<JamSessionType> {
    return this.jamSessionApiService.editJamSession(id, data).pipe(
      map(session => this.mapToSingleJamSession(session)),
      tap(() => {
        this.clearJamSessionCache(id);
        this.invalidateAllCaches();
      })
    );
  }

  /**
   * Delete jam session
   * Removes from signal and clears relevant caches after successful deletion
   */
  deleteJamSession(id: number): Observable<void> {
    return this.jamSessionApiService.deleteJamSession(id).pipe(
      tap(() => {
        // Remove from ownedJamSessions signal immediately
        const currentOwned = this.ownedJamSessions();
        this.ownedJamSessions.set(currentOwned.filter(session => session.id !== id));
        
        // Clear caches
        this.clearJamSessionCache(id);
        this.invalidateAllCaches();
      })
    );
  }

  /**
   * Join jam session
   * Invalidates caches after successful join
   */
  joinJamSession(jamSessionId: number, instrumentAndRatingId: number): Observable<any> {
    return this.jamSessionApiService.joinJamSession(jamSessionId, instrumentAndRatingId).pipe(
      tap(() => {
        this.clearJamSessionCache(jamSessionId);
        this.invalidateSignedUpCaches();
        this.invalidateAllCaches();
      })
    );
  }

  /**
   * Leave jam session
   * Removes from signal and invalidates caches after successfully leaving
   */
  leaveJamSession(jamSessionId: number, userId: number): Observable<string> {
    return this.jamSessionApiService.leaveJamSession(jamSessionId, userId).pipe(
      tap(() => {
        // Remove from signedUpJamSessions signal immediately
        const currentSignedUp = this.signedUpJamSessions();
        this.signedUpJamSessions.set(currentSignedUp.filter(session => session.id !== jamSessionId));
        
        // Clear caches
        this.clearJamSessionCache(jamSessionId);
        this.invalidateSignedUpCaches();
        this.invalidateAllCaches();
      })
    );
  }

  /**
   * Clear cache for specific jam session
   */
  private clearJamSessionCache(id: number): void {
    this.jamSessionCache.delete(id);
  }

  /**
   * Invalidate all jam sessions cache
   */
  private invalidateAllCaches(): void {
    this.allJamSessionsCacheValid.set(false);
    this.allJamSessionsCache.set([]);
    this.ownedJamSessionsCache.clear();
    this.signedUpJamSessionsCache.clear();
  }

  /**
   * Invalidate signed up jam sessions caches
   */
  private invalidateSignedUpCaches(): void {
    this.signedUpJamSessionsCache.clear();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.jamSessionCache.clear();
    this.invalidateAllCaches();
  }

  // Data transformation methods
  private mapToJamSessions(json: any[]): JamSessionType[] {
    return json.map(item => this.mapToSingleJamSession(item));
  }

  private mapToSingleJamSession(item: any): JamSessionType {
    return {
      id: item.id,
      owner: this.mapOwner(item),
      confirmedInstruments: this.mapConfirmedInstruments(item.confirmedInstruments),
      startTime: item.startTime,
      location: item.location,
      requiredInstruments: this.mapInstruments(item.requiredInstruments),
      musicGenre: item.musicGenre
    };
  }

  private mapOwner(item: any): ShortUser {
    if (item.ownerDto) {
      return {
        id: item.ownerDto.id,
        name: item.ownerDto.name
      };
    }
    if (item.owner) {
      return {
        id: item.owner.id,
        name: item.owner.name
      };
    }
    return { id: 0, name: 'Unknown' };
  }

  private mapConfirmedInstruments(instruments: any[]): InstrumentsAndRating[] {
    if (!Array.isArray(instruments)) return [];
    
    return instruments.map((i: any) => ({
      instrumentsAndRatingsId: i.id || 0,
      rating: i.rating || 0,
      instrumentId: i.instrument?.id || i.instrumentId || 0,
      instrumentName: i.instrument?.name || i.instrumentName || i.name || '',
      userId: i.userId || 0,
      name: i.instrument?.name || i.name || ''
    }));
  }

  private mapInstruments(instruments: any[]): Instrument[] {
    if (!Array.isArray(instruments)) return [];
    
    return instruments.map((i: any) => ({
      id: i.instrument?.id || i.id,
      name: i.instrument?.name || i.name
    }));
  }
}
