import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {InstrumentsAndRating, UserType} from '../model/user.type';
import {catchError, map, Observable, of, shareReplay, switchMap} from 'rxjs';
import {API_URLS} from '../config/api-urls';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private apiUserUrl = 'http://localhost:8080/api/users';
  private apiInstrumentsAndRatingsUrl = 'http://localhost:8080/api/rating';
  private userCache = new Map<number, Observable<UserType>>
  private apiUrls = API_URLS;

  getAllUsers(): Observable<UserType[]> {
    return this.http.get<any[]>(`${this.apiUserUrl}/all`).pipe(
      map(users => users.map(this.mapToUser)),
      switchMap(users => {
        if (users.length === 0) return of([]);
        
        // Fetch instruments and ratings for each user
        const userRequests = users.map(user => 
          this.http.get<{
            id: number;
            instrument: { id: number; name: string };
            rating: number
          }[]>(`${this.apiInstrumentsAndRatingsUrl}?userId=${user.id}`).pipe(
            map(this.mapToInstrumentsAndRatings),
            map(instrumentsAndRatings => ({...user, instrumentsAndRatings})),
            catchError(err => {
              console.error(`InstrumentsAndRatings Error for user ${user.id}`, err);
              return of({...user, instrumentsAndRatings: []} as UserType);
            })
          )
        );
        
        // Wait for all requests to complete
        return new Observable<UserType[]>(observer => {
          Promise.all(userRequests.map(req => req.toPromise()))
            .then(results => {
              observer.next(results.filter((r): r is UserType => r !== undefined));
              observer.complete();
            })
            .catch(err => {
              console.error('Error fetching all users with instruments', err);
              observer.next(users); // Return users without instruments if error
              observer.complete();
            });
        });
      }),
      catchError(err => {
        console.error('Get all users error', err);
        return of([]);
      })
    );
  }

  getUserById(userId: number): Observable<UserType> {
    if (!this.userCache.has(userId)) {
      const request$: Observable<UserType> = this.http.get<any>(`${this.apiUserUrl}/${userId}`).pipe(
        map(this.mapToUser),
        switchMap(user => this.http.get<{
          instrument: { name: string };
          rating: number
        }[]>(`${this.apiInstrumentsAndRatingsUrl}?userId=${userId}`).pipe(
          map(this.mapToInstrumentsAndRatings),
          map(instrumentsAndRatings => ({...user, instrumentsAndRatings})),
          catchError(err => {
            console.error('InstrumentsAndRatings Error', err);
            return of({...user, ratings: []} as UserType);
          })
        )),
        shareReplay(1),
        catchError(err => {
          console.error("Get user error", err)
          return of(null as unknown as UserType);
        })
      );
      this.userCache.set(userId, request$);
    }
    return this.userCache.get(userId) ?? of(this.getEmptyUser());
  }

  updateUser(formValue: any, userId: number): Observable<any> {
    console.log(formValue);
    return this.http.patch(`${this.apiUserUrl}/update/${userId}`, {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      bio: formValue.bio,
      favouriteGenreIds: formValue.genres
    });
  }

  clearUserCache(userId: number) {
    this.userCache.delete(userId);
  }

  updateUserImage(image: File) {
    const formData = new FormData();
    formData.append('file', image);
    return this.http.post(`${this.apiUrls.IMAGE_URL}/profile-picture`, formData, {});
  }

  private mapToUser(json: any): UserType {
    return {
      id: json.id,
      name: json.name,
      email: json.email,
      bio: json.bio,
      profilePictureId: json.profilePictureId,
      musicGenres: json.favoriteGenres,
      instrumentsAndRatings: []
    };
  }

  private mapToInstrumentsAndRatings(json: any): InstrumentsAndRating[] {
    console.log(json);
    return json.map((item: {
      id: number;
      rating: number
      instrumentId: number;
      instrumentName: string;
      userId: number;
      name: string
    }) => ({
      instrumentsAndRatingsId: item.id,
      rating: item.rating,
      instrumentId: item.instrumentId,
      instrumentName: item.instrumentName,
      userId: item.userId,
      name: item.name
    }))
  }

  private getUserRating(id: number) {
    return this.http.get<{
      instrument: { name: string };
      rating: number
    }[]>(`http://localhost:8080/api/rating?userId=${id}`);
  }

  private getEmptyUser(): UserType {
    return {
      id: 0,
      name: '',
      email: '',
      bio: '',
      profilePictureId: 0,
      musicGenres: [],
      instrumentsAndRatings: [],
    };
  }

}
