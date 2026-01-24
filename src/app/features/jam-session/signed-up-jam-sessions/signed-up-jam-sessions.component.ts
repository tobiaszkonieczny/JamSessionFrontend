import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatChip, MatChipSet } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { JamSessionType } from '../model/jamSession.type';
import { JamSessionDomainService } from '../services/jam-session-domain.service';
import { AuthDomainService } from '../../../core/auth/services/auth-domain.service';

@Component({
  selector: 'app-signed-up-jam-sessions',
  standalone: true,
  imports: [
    CommonModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatButton,
    MatIcon,
    MatChip,
    MatChipSet,
    MatProgressSpinner
  ],
  templateUrl: './signed-up-jam-sessions.component.html',
  styleUrl: './signed-up-jam-sessions.component.css'
})
export class SignedUpJamSessionsComponent {
  private jamSessionDomain = inject(JamSessionDomainService);
  private authDomain = inject(AuthDomainService);
  private router = inject(Router);

  jamSessions = this.jamSessionDomain.signedUpJamSessions;
  isLoading = this.jamSessionDomain.isLoadingSignedUp;
  hasSessions = computed(() => this.jamSessions().length > 0);

  constructor() {
    const userId = this.authDomain.currentUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.jamSessionDomain.loadSignedUpJamSessions(userId);
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
    const userId = this.authDomain.currentUserId();
    if (!userId) return [];
    
    return session.confirmedInstruments
      .filter(ci => (ci as any).user?.id === userId)
      .map(ci => ci.instrumentName!);
  }

  leaveSession(session: JamSessionType): void {
    const userId = this.authDomain.currentUserId();
    if (!userId) return;
    
    if (!confirm(`Are you sure you want to leave "${session.musicGenre.name}" jam session?`)) {
      return;
    }

    this.jamSessionDomain.leaveJamSession(session.id, userId).subscribe({
      error: (e) => {
        console.error('Error leaving jam session:', e);
        alert('Failed to leave jam session. Please try again.');
      }
    });
  }
}
