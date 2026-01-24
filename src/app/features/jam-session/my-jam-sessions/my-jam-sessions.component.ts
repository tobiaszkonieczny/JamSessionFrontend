import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { JamSessionDomainService } from '../services/jam-session-domain.service';
import { JamSessionType } from '../model/jamSession.type';
import { AuthDomainService } from '../../../core/auth/services/auth-domain.service';

@Component({
  selector: 'app-my-jam-sessions',
  standalone: true,
  imports: [
    CommonModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatButton,
    MatIconButton,
    MatIcon,
    MatProgressSpinner,
    MatTooltip,
  
],
  templateUrl: './my-jam-sessions.component.html',
  styleUrl: './my-jam-sessions.component.css'
})
export class MyJamSessionsComponent {
  private jamSessionDomain = inject(JamSessionDomainService);
  private authDomain = inject(AuthDomainService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  jamSessions = this.jamSessionDomain.ownedJamSessions;
  isLoading = this.jamSessionDomain.isLoadingOwned;
  hasJamSessions = computed(() => this.jamSessions().length > 0);

  constructor() {
    const userId = this.authDomain.currentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.jamSessionDomain.loadOwnedJamSessions(userId);
  }
  
  createJamSession(): void {
    this.router.navigate(['/jam-session']);
  }

  viewSession(id: number): void {
     this.router.navigate([`/jam-session-page/${id}`]);
  }

  editSession(session: JamSessionType): void {
    this.router.navigate(['/edit-jam-session', session.id]);
  }

  deleteSession(session: JamSessionType): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialog, {
      data: session,
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.jamSessionDomain.deleteJamSession(session.id).subscribe({
          error: (e) => console.error('Error deleting session:', e)
        });
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

@Component({
  selector: 'delete-confirm-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose, MatButton],
  template: `
    <h2 mat-dialog-title>Delete Jam Session</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete this jam session? This action cannot be undone.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">Delete</button>
    </mat-dialog-actions>
  `
})
export class DeleteConfirmDialog {}
