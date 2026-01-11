import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { JamSessionService } from '../services/jam-session.service';
import { JamSessionType } from '../model/jamSession.type';
import { jwtDecode } from 'jwt-decode';

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
    MatIcon,
    MatChip,
    MatChipSet,
  
],
  templateUrl: './my-jam-sessions.component.html',
  styleUrl: './my-jam-sessions.component.css'
})
export class MyJamSessionsComponent {
  private jamSessionService = inject(JamSessionService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // State
  jamSessions = signal<JamSessionType[]>([]);
  isLoading = signal<boolean>(true);
  userId = signal<number | null>(null);

  // Computed
  hasJamSessions = computed(() => this.jamSessions().length > 0);

  constructor() {
    this.loadUserSessions();
  }

  private loadUserSessions(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const decodedToken: any = jwtDecode(token);
    const userId = decodedToken['sub'];
    this.userId.set(userId);

    this.jamSessionService.getOwnedJamSessions(userId).subscribe({
      next: (sessions) => {
        console.log('Loaded jam sessions:', sessions);
        this.jamSessions.set(sessions);
        this.isLoading.set(false);
      },
      error: (e) => {
        console.error('Error loading jam sessions:', e);
        this.isLoading.set(false);
      }
    });
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
        this.jamSessionService.deleteJamSession(session.id).subscribe({
          next: () => {
            this.jamSessions.update(sessions => 
              sessions.filter(s => s.id !== session.id)
            );
          },
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
