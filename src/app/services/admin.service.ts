import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  addGenre(genreName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/genres/create`, { name: genreName });
  }

  getAllGenres(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/genres/all`);
  }

  addInstrument(instrumentName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/instruments/new`, { name: instrumentName });
  }

  getAllInstruments(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/instruments/all`);
  }

  removeGenre(id: number) {
    return this.http.delete(`http://localhost:8080/api/genres/delete?id=${id}`, { responseType: 'text' });
  }

  removeInstrument(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/instruments/delete?id=${id}`, { responseType: 'text' });
  }
}
