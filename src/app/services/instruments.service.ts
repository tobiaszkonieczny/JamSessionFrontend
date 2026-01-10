import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {API_URLS} from '../config/api-urls';
import {map} from 'rxjs';
import {Instrument} from '../model/jamSession.type';

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {

  private apiUrls = API_URLS;


  constructor(private http: HttpClient) {
  }

  getAllInstruments() {
    return this.http.get(`${this.apiUrls.INSTRUMENTS_URL}/all`).pipe(map(this.mapToInstruments));

  }


  private mapToInstruments(json: any): Instrument[] {
    const test = json.map((item: any) => ({id: item.id, name: item.name}));
    console.log(test);
    return test;
  }

}
