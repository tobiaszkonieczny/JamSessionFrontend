import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError } from 'rxjs';
import { CommentApiService } from '../api/comment-api.service';
import { CommentType, ReactionType } from '../model/comment.type';

/**
 * Comment Domain Service - manages jam session comments
 * Responsibility: Business logic for comments, state management
 */
@Injectable({
  providedIn: 'root'
})
export class CommentDomainService {
  private readonly commentApiService = inject(CommentApiService);

  // Cache for comments by jam session ID (reactive signal-based)
  private commentsCacheSignal = signal<Map<string, CommentType[]>>(new Map());
  
  // Operation states
  readonly isLoadingComments = signal<string | null>(null);
  readonly isAddingComment = signal<boolean>(false);
  readonly isDeletingComment = signal<number | null>(null);
  readonly isReacting = signal<number | null>(null);

  /**
   * Get comments signal for a jam session
   */
  getComments(jamSessionId: string): CommentType[] {
    const cache = this.commentsCacheSignal();
    return cache.get(jamSessionId) || [];
  }

  /**
   * Load comments for a jam session
   * forceRefresh=true will reload even if cache exists (but won't clear it first)
   */
  loadComments(jamSessionId: string, forceRefresh: boolean = false): void {
    const cache = this.commentsCacheSignal();
    if (!forceRefresh && cache.has(jamSessionId)) {
      return;
    }

    this.isLoadingComments.set(jamSessionId);

    this.commentApiService.getComments(jamSessionId).subscribe({
      next: (comments) => {
        const newCache = new Map(this.commentsCacheSignal());
        newCache.set(jamSessionId, comments);
        this.commentsCacheSignal.set(newCache);
        this.isLoadingComments.set(null);
      },
      error: () => {
        this.isLoadingComments.set(null);
      }
    });
  }

  /**
   * Add a comment to a jam session
   * Reloads cache silently without clearing first
   */
  addComment(
    jamSessionId: string, 
    message: string, 
    imageFile?: File, 
    parentId?: number
  ): Observable<CommentType> {
    this.isAddingComment.set(true);

    return this.commentApiService.addComment(jamSessionId, message, imageFile, parentId).pipe(
      tap(() => {
        this.loadComments(jamSessionId, true);
        this.isAddingComment.set(false);
      }),
      catchError(error => {
        console.error('Error adding comment:', error);
        this.isAddingComment.set(false);
        throw error;
      })
    );
  }

  /**
   * Delete a comment
   * Reloads cache silently without clearing first
   */
  deleteComment(jamSessionId: string, messageId: number): Observable<string> {
    this.isDeletingComment.set(messageId);

    return this.commentApiService.deleteComment(jamSessionId, messageId).pipe(
      tap(() => {
        this.loadComments(jamSessionId, true);
        this.isDeletingComment.set(null);
      }),
      catchError(error => {
        console.error('Error deleting comment:', error);
        this.isDeletingComment.set(null);
        throw error;
      })
    );
  }

  /**
   * React to a comment
   * Reloads cache silently without clearing first
   */
  reactToMessage(jamSessionId: string, messageId: number, reactionType: ReactionType): Observable<CommentType> {
    this.isReacting.set(messageId);

    return this.commentApiService.reactToMessage(messageId, reactionType).pipe(
      tap(() => {
        this.loadComments(jamSessionId, true);
        this.isReacting.set(null);
      }),
      catchError(error => {
        console.error('Error reacting to comment:', error);
        this.isReacting.set(null);
        throw error;
      })
    );
  }

  /**
   * Clear comments cache for a specific jam session
   */
  clearCommentsCache(jamSessionId: string): void {
    const newCache = new Map(this.commentsCacheSignal());
    newCache.delete(jamSessionId);
    this.commentsCacheSignal.set(newCache);
  }

  /**
   * Clear all comments cache
   */
  clearAllCache(): void {
    this.commentsCacheSignal.set(new Map());
  }

  /**
   * Get cached comments (synchronous)
   */
  getCachedComments(jamSessionId: string): CommentType[] | undefined {
    return this.commentsCacheSignal().get(jamSessionId);
  }
}
