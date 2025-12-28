import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_URLS } from '../config/api-urls';
import { EditJamSessionDto, JamSessionType } from '../model/jamSession.type';

@Injectable({
  providedIn: 'root'
})
export class JamSessionService {

  private apiUrls = API_URLS;

  constructor(private http: HttpClient) {
    console.log('JamSessionService initialized');
  }

  getAllJamSessions(): Observable<JamSessionType[]> {
    return this.http.get(`${this.apiUrls.JAM_SESSIONS_URL}/all`).pipe(map((json) => this.mapToJamSessions(json)));
  }

  getOwnedJamSessions(userId: number): Observable<JamSessionType[]> {
    return this.http.get(`${this.apiUrls.JAM_SESSIONS_URL}/own/${userId}`).pipe(map((json) => this.mapToJamSessions(json)));
  }

  getSignedUpJamSessions(userId: number): Observable<JamSessionType[]> {
    return this.http.get(`${this.apiUrls.JAM_SESSIONS_URL}/signed-up/${userId}`).pipe(map((json) => this.mapToJamSessions(json)));
  }

  editJamSession(id: number, data: EditJamSessionDto): Observable<JamSessionType> {
    return this.http.patch<any>(`${this.apiUrls.JAM_SESSIONS_URL}/edit/${id}`, data)
      .pipe(map(item => this.mapToSingleJamSession(item)));
  }

  deleteJamSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrls.JAM_SESSIONS_URL}/delete/${id}`);
  }

  getJamSessionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrls.JAM_SESSIONS_URL}/${id}`);
  }

  joinJamSession(jamSessionId: number, instrumentAndRatingId: number): Observable<any> {
    return this.http.post(`${this.apiUrls.JAM_SESSIONS_URL}/join/${jamSessionId}`, {
      instrumentAndRatingId: instrumentAndRatingId
    });
  }

  leaveJamSession(jamSessionId: number, userId: number): Observable<any> {
    console.log(`Leaving jam session ${jamSessionId} for user ${userId}`);
    return this.http.delete(`${this.apiUrls.JAM_SESSIONS_URL}/leave/${jamSessionId}/${userId}`, { responseType: 'text' });
  }

  private mapToJamSessions(json: any): JamSessionType[] {
    return json.map((item: any) => this.mapToSingleJamSession(item));
  }

  private mapToSingleJamSession(item: any): JamSessionType {
    return {
      id: item.id,
      owner: item.ownerDto ? {
        id: item.ownerDto.id,
        name: item.ownerDto.name
      } : item.owner || { id: 0, name: 'Unknown' },
      confirmedInstruments: item.confirmedInstruments?.map((i: any) => ({
        id: i.instrument?.id || i.id,
        name: i.instrument?.name || i.name
      })) || [],
      startTime: item.startTime,
      location: item.location,
      requiredInstruments: item.requiredInstruments?.map((i: any) => ({
        id: i.id,
        name: i.name
      })) || [],
      musicGenre: item.musicGenre
    };
  }

}
