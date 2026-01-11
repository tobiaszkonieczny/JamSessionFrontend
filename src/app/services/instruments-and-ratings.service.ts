import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {InstrumentsAndRating} from '../model/user.type';
import {API_URLS} from '../config/api-urls';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsAndRatingsService {

  private apiUrls = API_URLS;

  constructor(private http: HttpClient) {

  }

  addInstrumentsAndRatings(value: InstrumentsAndRating[]): Observable<any> {
    const filteredData = value.map(({userId, instrumentId, rating}) => ({userId, instrumentId, rating}));
    return this.http.post(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}/batch`,
      filteredData
    )

  }
}
