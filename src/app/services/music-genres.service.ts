import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {API_URLS} from '../config/api-urls';
import {MusicGenre} from '../model/user.type';
import {catchError, map, Observable, of, shareReplay} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MusicGenresService {

  private apiUrls = API_URLS;
  private genresCache$: Observable<MusicGenre[]> | null = null;

  constructor(private http: HttpClient) {
  }

  getAllGenres(): Observable<MusicGenre[]> {
    if (!this.genresCache$) {
      this.genresCache$ = this.http.get<any>(`${this.apiUrls.MUSIC_GENRES_URL}/all`)
        .pipe(map(this.mapToMusicGenres)).pipe(shareReplay(1), catchError(err => {
          console.error("Getting music genres error", err);
          return of([]);
        }))

    }
    return this.genresCache$ ?? of([]);
  }

  //Use after adding new genres!!!!
  clearCache() {
    this.genresCache$ = null;
  }


  private mapToMusicGenres(json: any): MusicGenre[] {
    return json.map((genre: { id: number; name: string }) => ({
      id: genre.id,
      name: genre.name
    }))
  }
}
