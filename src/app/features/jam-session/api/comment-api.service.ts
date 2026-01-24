import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URLS } from '../../../core/config/api-urls';
import { CommentType, ReactionType } from '../model/comment.type';

/**
 * Comment API Service - handles HTTP communication for jam session comments
 * Responsibility: Only API calls for comments and reactions
 */
@Injectable({
  providedIn: 'root'
})
export class CommentApiService {
  private readonly apiUrls = API_URLS;

  constructor(private http: HttpClient) {}

  /**
   * Get all comments for a jam session
   */
  getComments(jamSessionId: string): Observable<CommentType[]> {
    console.log('Fetching comments for jam session ID:', jamSessionId);
    return this.http.get<CommentType[]>(`${this.apiUrls.JAM_SESSIONS_URL}/comments/${jamSessionId}`);
  }

  /**
   * Add a comment to a jam session
   */
  addComment(
    jamSessionId: string, 
    message: string, 
    imageFile?: File, 
    parentId?: number
  ): Observable<CommentType> {
    console.log('Adding comment with message:', message, 'and imageFile:', imageFile, 'and parentId:', parentId);
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

  /**
   * Delete a comment
   */
  deleteComment(jamSessionId: string, messageId: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrls.JAM_SESSIONS_URL}/comments/${jamSessionId}/${messageId}`,
      { responseType: 'text' }
    );
  }

  /**
   * React to a comment
   */
  reactToMessage(messageId: number, reactionType: ReactionType): Observable<CommentType> {
    const params = new HttpParams().set('type', reactionType);
    return this.http.post<CommentType>(
      `${this.apiUrls.JAM_SESSIONS_URL}/comments/${messageId}/react`,
      null,
      { params }
    );
  }

  /**
   * TODO: Edit comment endpoint
   */
  // editComment(jamSessionId: string, messageId: number, message: string): Observable<CommentType> {
  //   return this.http.patch<CommentType>(
  //     `${this.apiUrls.JAM_SESSIONS_URL}/comments/${jamSessionId}/${messageId}`,
  //     { message }
  //   );
  // }
}
