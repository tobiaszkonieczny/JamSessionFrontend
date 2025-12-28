import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {InstrumentsAndRatings} from '../model/user.type';
import {API_URLS} from '../config/api-urls';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsAndRatingsService {

  private apiUrls = API_URLS;

  constructor(private http: HttpClient) {

  }

  addInstrumentsAndRatings(value: InstrumentsAndRatings[]): Observable<any> {
    const filteredData = value.map(({instrumentId, rating}) => ({instrumentId, rating}));
    return this.http.post(`${this.apiUrls.INSTRUMENTS_AND_RATINGS_URL}/new`,
      filteredData
    )

  }
}
