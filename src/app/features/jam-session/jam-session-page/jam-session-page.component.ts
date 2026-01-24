import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatCard, MatCardContent, MatCardHeader, MatCardModule} from '@angular/material/card';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {DatePipe, KeyValuePipe, NgForOf, NgIf, NgTemplateOutlet, SlicePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MapComponent} from '../../../shared/components/map/map.component';
import * as Leaflet from 'leaflet';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {InstrumentsAndRating, UserType} from '../../../shared/model/user.type';
import {MatIcon} from '@angular/material/icon';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {CommentType, ReactionType} from '../model/comment.type';
import {MatTooltip} from '@angular/material/tooltip';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import { AuthDomainService } from '../../../core/auth/services/auth-domain.service';
import { API_URLS } from '../../../core/config/api-urls';
import { LazyImageComponent } from '../../../shared/lazy-image.component';
import { ImageService } from '../../../shared/services/image-domain.service';
import { UserDomainService } from '../../user/services/user-domain.service';
import { CommentDomainService } from '../services/comment-domain.service';
import { JamSessionDomainService } from '../services/jam-session-domain.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-jam-session-page',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    NgForOf,
    MapComponent,
    MatIcon,
    SlicePipe,
    DatePipe,
    MatCardModule,
    NgIf,
    MatTableModule,
    MatProgressSpinner,
    MatIconButton,
    FormsModule,
    MatInputModule,
    LazyImageComponent,
    KeyValuePipe,
    NgTemplateOutlet,
    MatTooltip
  ],
  templateUrl: './jam-session-page.component.html',
  styleUrl: './jam-session-page.component.css'
})
export class JamSessionPageComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private userDomain = inject(UserDomainService);
  private router = inject(Router);
  private commentDomain = inject(CommentDomainService);
  private imageService = inject(ImageService);
  private authDomain = inject(AuthDomainService);
  private jamSessionDomain = inject(JamSessionDomainService);
  private snackBar = inject(MatSnackBar);
  dialog = inject(MatDialog);
  
  readonly apiUrls = API_URLS;
  readonly columns: string[] = ["attendee", "instrument", "rating", "page", "actions"];
  readonly ownerColumns: string[] = ["attendee", "instrument", "page"];
  
  id = signal<string | null>(null);
  jamSession = signal<any>(null);
  owner = signal<string | undefined>(undefined);
  date = signal<string>('');
  time = signal<string>('');
  coordinates = signal<Leaflet.LatLngExpression>([50.292262, 18.667510]);
  address = signal<string>('');
  user = signal<UserType | undefined>(undefined);
  isLoaded = signal<boolean>(false);
  
  newCommentText = signal<string>('');
  selectedImageFile = signal<File | null>(null);
  imagePreview = signal<string | ArrayBuffer | null>(null);
  submittingComment = signal<boolean>(false);
  replyingTo = signal<CommentType | null>(null);
  
  comments = computed(() => {
    const sessionId = this.id();
    return sessionId ? this.commentDomain.getComments(sessionId) : [];
  });

  readonly reactionTypes = [
    { type: ReactionType.LIKE, emoji: '👍', label: 'Like' },
    { type: ReactionType.LOVE, emoji: '❤️', label: 'Love' },
    { type: ReactionType.HAHA, emoji: '😂', label: 'Laugh' },
    { type: ReactionType.SAD, emoji: '😢', label: 'Sad' },
    { type: ReactionType.ANGRY, emoji: '😠', label: 'Angry' }
  ];
  
  isAdmin = computed(() => this.authDomain.isAdmin());
  
  // Computed values
  dataSource = computed(() => 
    new MatTableDataSource(this.jamSession()?.confirmedInstruments || [])
  );

  ownerDataSource = computed(() => {
    const session = this.jamSession();
    const ownerData = session?.owner ? [session.owner] : [];
    return new MatTableDataSource(ownerData);
  });

  myConfirmedInstruments = computed(() => {
    const session = this.jamSession();
    const currentUser = this.user();
    if (!session?.confirmedInstruments || !currentUser?.id) return [];
    return session.confirmedInstruments.filter(
      (item: any) => item.userId === currentUser.id
    );
  });

  isAlreadySignedUp = computed(() => {
    return this.myConfirmedInstruments().length > 0;
  });

  // Group required instruments by name with counts
  groupedRequiredInstruments = computed(() => {
    const session = this.jamSession();
    if (!session?.requiredInstruments) return [];
    
    const grouped = new Map<string, { name: string, id: number, total: number, confirmed: number }>();
    
    // Count required instruments
    session.requiredInstruments.forEach((inst: any) => {
      if (grouped.has(inst.name)) {
        grouped.get(inst.name)!.total++;
      } else {
        grouped.set(inst.name, { name: inst.name, id: inst.id, total: 1, confirmed: 0 });
      }
    });
    
    // Count confirmed instruments
    session.confirmedInstruments?.forEach((item: InstrumentsAndRating) => {
      const name = item.instrumentName;
      if (grouped.has(name!)) {
        grouped.get(name!)!.confirmed++;
      }
    });
    
    return Array.from(grouped.values());
  });


  constructor() {
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id.set(routeId);
    
    const loggedInUserId = this.authDomain.currentUserId();
    if (loggedInUserId) {
      this.userDomain.getUserById(loggedInUserId).subscribe(result => {
        this.user.set(result);
      });
    }
    
    this.loadComponent();
  }

  getOwner() {
    const session = this.jamSession();
    if (!session?.owner?.id) return;
    
    this.http.get<any>(`http://localhost:8080/api/users/${session.owner.id}`)
      .subscribe({
        next: (response) => {
          console.log(response);
          this.owner.set(response.name);
        }
      });
  }

  getAddress(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        const road = response.address.road || 'Unknown road';
        const houseNumber = response.address.house_number || 'No number';
        const city = response.address.village || response.address.city || response.address.town || 'Unknown city';
        this.address.set(`${road}, ${houseNumber}, ${city}`);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  openDialog(instrument: string) {


    this.dialog.open(JamSessionDialog, {
      data: instrument
    })
      .afterClosed().subscribe(result => {
      if (result) {
        this.signUpUserForJamSession(instrument);
      }
    })
  }

  signUpUserForJamSession(instrument: string) {
    const currentUser = this.user();
    const sessionId = this.id();
    
    if (this.isAlreadySignedUp()) {
      this.dialog.open(InfoDialog, {
        data: {
          title: 'Already Signed Up',
          message: 'You are already signed up for this jam session. You can only sign up for one instrument per session.',
          type: 'warning'
        }
      });
      return;
    }
    
    if (!currentUser?.instrumentsAndRatings?.length) {
      this.dialog.open(InfoDialog, {
        data: {
          title: 'No Instruments',
          message: 'You don\'t have any instruments listed in your profile. Please add instruments to your profile first.',
          type: 'warning'
        }
      });
      return;
    }
    
    const matchingInstrument = currentUser.instrumentsAndRatings.find(
      ir => ir.instrumentName === instrument
    );
    
    if (!matchingInstrument || !matchingInstrument.instrumentsAndRatingsId) {
      this.dialog.open(InfoDialog, {
        data: {
          title: 'Instrument Not Found',
          message: `You don't have ${instrument} listed in your profile. Please add it to your profile first.`,
          type: 'warning'
        }
      });
      return;
    }
    
    if (!sessionId) return;
    
    this.jamSessionDomain.joinJamSession(
      parseInt(sessionId), 
      matchingInstrument.instrumentsAndRatingsId
    ).subscribe({
      next: () => {
        this.snackBar.open('Successfully signed up for this Jam Session!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loadComponent();
      },
      error: () => {
        this.snackBar.open('Failed to sign up. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  openRemoveDialog() {
    this.dialog.open(JamSessionRemoveDialog, {
      data: 'yourself'
    }).afterClosed().subscribe(result => {
      if (result) {
        this.leaveSelf();
      }
    });
  }

  leaveSelf() {
    const currentUser = this.user();
    const sessionId = this.id();
    
    if (!sessionId || !currentUser?.id) {
      this.snackBar.open('Unable to leave session', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }
    this.jamSessionDomain.leaveJamSession(parseInt(sessionId), currentUser.id).subscribe({
      next: () => {
        this.snackBar.open('Successfully left the Jam Session', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.loadComponent();
      },
      error: () => {
        this.snackBar.open('Failed to leave session', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  isInstrumentConfirmed(instrumentName: string): boolean {
    const grouped = this.groupedRequiredInstruments().find(g => g.name === instrumentName);
    if (!grouped) return false;
    
    // Disable if all slots are filled OR if user is already signed up
    return grouped.confirmed >= grouped.total || this.isAlreadySignedUp();
  }

  shouldBeDisabled(instrumentAndRatingId: String): boolean {
    const currentUser = this.user();
    const canLoad = currentUser?.instrumentsAndRatings?.some(item => {
      return item.instrumentsAndRatingsId?.toString() == instrumentAndRatingId;
    });
    return !canLoad;
  }

  navigateToPage(userId: string) {
    this.router.navigate(["/profile"],{queryParams: {userId: userId}});
  }
  isOwner(): boolean {
    const session = this.jamSession();
    const currentUser = this.user();
    return session?.owner?.id === currentUser?.id;
  }

  canRemoveParticipant(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  removeParticipant(userId: number, userName: string) {
    const sessionId = this.id();
    if (!sessionId) return;
    
    const dialogRef = this.dialog.open(InfoDialog, {
      data: {
        title: 'Remove Participant',
        message: `Are you sure you want to remove ${userName} from this jam session?`,
        type: 'confirm'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      
      this.jamSessionDomain.leaveJamSession(parseInt(sessionId), userId).subscribe({
        next: () => {
          this.snackBar.open(`${userName} has been removed from the jam session`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadComponent();
        },
        error: () => {
          this.snackBar.open('Failed to remove participant', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    });
  }

  private loadComponent() {
    const sessionId = this.id();
    if (!sessionId) return;
    
    this.jamSessionDomain.getJamSessionById(parseInt(sessionId))
      .subscribe({
        next: (response) => {
          this.jamSession.set(response);
          
          const [date, time] = response.startTime.split('T');
          this.date.set(date);
          this.time.set(time);
          
          this.getOwner();
          
          const coords = response?.location
            ? [response.location.latitude, response.location.longitude] as Leaflet.LatLngExpression
            : [50.292262, 18.667510] as Leaflet.LatLngExpression;
          this.coordinates.set(coords);
          
          this.getAddress(response.location.latitude, response.location.longitude);
          this.isLoaded.set(true);
          
          this.commentDomain.loadComments(sessionId);
          
          const comments = this.commentDomain.getComments(sessionId);
          const imageIds = comments
            .map((c: CommentType) => c.imageUrl)
            .filter((id: string | null | undefined) => id != null) as (string | number)[];
          if (imageIds.length > 0) {
            this.imageService.preloadImages(imageIds);
          }
        }
      });
  }

  onCommentImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedImageFile.set(null);
      this.imagePreview.set(null);
      return;
    }
    
    const file = input.files[0];
    this.selectedImageFile.set(file);
    
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result);
    };
    reader.readAsDataURL(file);
  }

  submitComment() {
    const sessionId = this.id();
    const text = this.newCommentText();
    const imageFile = this.selectedImageFile();
    const parentComment = this.replyingTo();
    
    if (!sessionId || !text.trim()) return;
    
    this.submittingComment.set(true);
    this.commentDomain.addComment(
      sessionId, 
      text.trim(), 
      imageFile || undefined,
      parentComment?.id
    ).subscribe({
        next: () => {
          this.newCommentText.set('');
          this.selectedImageFile.set(null);
          this.imagePreview.set(null);
          this.submittingComment.set(false);
          this.replyingTo.set(null);
        },
        error: (error) => {
          console.error('Failed to submit comment', error);
          this.submittingComment.set(false);
        }
      });
  }

  replyToComment(comment: CommentType) {
    this.replyingTo.set(comment);
    this.newCommentText.set('');
  }

  cancelReply() {
    this.replyingTo.set(null);
    this.newCommentText.set('');
  }

  reactToComment(commentId: number, reactionType: ReactionType) {
    const sessionId = this.id();
    if (!sessionId) return;
    this.commentDomain.reactToMessage(sessionId, commentId, reactionType).subscribe();
  }

  getReactionEmoji(reactionType: any): string {
    const reaction = this.reactionTypes.find(r => r.type === reactionType);
    return reaction?.emoji || '';
  }

  canReply(comment: CommentType): boolean {
    return !comment.parentId;
  }

  deleteComment(comment: CommentType) {
    const sessionId = this.id();
    if (!sessionId) return;
    
    const dialogRef = this.dialog.open(InfoDialog, {
      data: {
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment? This action cannot be undone.',
        type: 'confirm'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.commentDomain.deleteComment(sessionId, comment.id).subscribe({
        next: () => {
          this.snackBar.open('Comment deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        },
        error: () => {
          this.snackBar.open('Failed to delete comment', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    });
  }


}

@Component({
  selector: 'dialog-data-example-dialog',
  templateUrl: 'jam-session-dialog.html',
  imports: [MatDialogTitle, MatDialogContent, MatButton, MatDialogClose, MatDialogActions],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JamSessionDialog {
  data = inject(MAT_DIALOG_DATA);
}

@Component({
  selector: 'dialog-data-remove-dialog',
  templateUrl: 'jam-session-remove-dialog.html',
  imports: [MatDialogTitle, MatDialogContent, MatButton, MatDialogClose, MatDialogActions],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JamSessionRemoveDialog {
  data = inject(MAT_DIALOG_DATA);
}

@Component({
  selector: 'info-dialog',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, MatButton, MatDialogClose, MatIcon],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [class]="'dialog-icon ' + data.type">{{ getIcon() }}</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p class="dialog-message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (data.type === 'confirm') {
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" [mat-dialog-close]="true">Confirm</button>
      } @else {
        <button mat-raised-button color="primary" mat-dialog-close>OK</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-icon {
      vertical-align: middle;
      margin-right: 8px;
    }
    .dialog-icon.warning {
      color: #ff9800;
    }
    .dialog-icon.error {
      color: #f44336;
    }
    .dialog-icon.success {
      color: #4caf50;
    }
    .dialog-icon.confirm {
      color: #2196f3;
    }
    .dialog-message {
      margin: 16px 0;
      font-size: 14px;
      line-height: 1.5;
    }
    h2 {
      display: flex;
      align-items: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoDialog {
  data = inject<{ title: string, message: string, type: 'warning' | 'error' | 'success' | 'confirm' }>(MAT_DIALOG_DATA);
  
  getIcon(): string {
    switch (this.data.type) {
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check_circle';
      case 'confirm': return 'help_outline';
      default: return 'info';
    }
  }
}
