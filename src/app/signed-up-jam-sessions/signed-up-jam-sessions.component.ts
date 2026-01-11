import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { JamSessionService } from '../services/jam-session.service';
import { JamSessionType } from '../model/jamSession.type';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-signed-up-jam-sessions',
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
  templateUrl: './signed-up-jam-sessions.component.html',
  styleUrl: './signed-up-jam-sessions.component.css'
})
export class SignedUpJamSessionsComponent {
  private jamSessionService = inject(JamSessionService);
  private router = inject(Router);

  // State
  jamSessions = signal<JamSessionType[]>([]);
  isLoading = signal<boolean>(true);
  userId = signal<number | null>(null);

  // Computed
  hasSessions = computed(() => this.jamSessions().length > 0);

  constructor() {
    this.loadSignedUpSessions();
  }

  private loadSignedUpSessions(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const decodedToken: any = jwtDecode(token);
    const userId = decodedToken['sub'];
    this.userId.set(userId);

    this.jamSessionService.getSignedUpJamSessions(userId).subscribe({
      next: (sessions) => {
        this.jamSessions.set(sessions);
        this.isLoading.set(false);
      },
      error: (e) => {
        console.error('Error loading signed-up jam sessions:', e);
        this.isLoading.set(false);
      }
    });
  }

  viewSession(id: number): void {
    this.router.navigate([`/jam-session-page/${id}`]);
  }

  findSessions(): void {
    this.router.navigate(['/jam-session']);
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

  getMyInstruments(session: JamSessionType): string[] {
    const userId = this.userId();
    if (!userId) return [];
    
    return session.confirmedInstruments
      .filter(ci => (ci as any).user?.id === userId)
      .map(ci => ci.instrumentName!);
  }

  leaveSession(session: JamSessionType): void {
    const userId = this.userId();
    if (!userId) return;
    
    if (!confirm(`Are you sure you want to leave "${session.musicGenre.name}" jam session?`)) {
      return;
    }

    this.jamSessionService.leaveJamSession(session.id, userId).subscribe({
      next: () => {
        alert('You have successfully left the jam session');
        this.loadSignedUpSessions();
      },
      error: (e) => {
        console.error('Error leaving jam session:', e);
        alert('Failed to leave jam session. Please try again.');
      }
    });
  }
}
