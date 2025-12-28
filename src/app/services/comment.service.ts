import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../config/api-urls';
import { CommentType, ReactionType } from '../model/comment.type';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  getComments(jamSessionId: string): Observable<CommentType[]> {
    return this.http.get<CommentType[]>(`${this.apiUrls.JAM_SESSIONS_URL}/comments/${jamSessionId}`);
  }

  addComment(jamSessionId: string, message: string, imageFile?: File, parentId?: number): Observable<CommentType> {
    const formData = new FormData();
    const createDto = { message };
    const jsonBlob = new Blob([JSON.stringify(createDto)], { type: 'application/json' });
    formData.append('data', jsonBlob);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    let params = new HttpParams();
    if (parentId !== undefined) {
      params = params.set('parentId', parentId.toString());
    }
    
    return this.http.post<CommentType>(
      `${this.apiUrls.JAM_SESSIONS_URL}/comments/${jamSessionId}`, 
      formData,
      { params }
    );
  }

  deleteComment(jamSessionId: string, messageId: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrls.JAM_SESSIONS_URL}/comments/${jamSessionId}/${messageId}`,
      { responseType: 'text' }
    );
  }

  reactToMessage(messageId: number, reactionType: ReactionType): Observable<CommentType> {
    const params = new HttpParams().set('type', reactionType);
    return this.http.post<CommentType>(
      `${this.apiUrls.JAM_SESSIONS_URL}/comments/${messageId}/react`,
      null,
      { params }
    );
  }
}
