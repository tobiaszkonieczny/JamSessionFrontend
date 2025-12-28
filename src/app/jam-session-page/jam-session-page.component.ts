import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MatCard, MatCardContent, MatCardHeader, MatCardModule} from '@angular/material/card';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {DatePipe, KeyValuePipe, NgForOf, NgIf, NgTemplateOutlet, SlicePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MapComponent} from '../map/map.component';
import * as Leaflet from 'leaflet';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton, MatMiniFabButton} from '@angular/material/button';
import {UserService} from '../services/user.service';
import {jwtDecode} from 'jwt-decode';
import {UserType} from '../model/user.type';
import {MatIcon} from '@angular/material/icon';
import {API_URLS} from '../config/api-urls';
import {Observable, of} from 'rxjs';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {MatInputModule} from '@angular/material/input';
import {CommentService} from '../services/comment.service';
import {CommentType, ReactionType} from '../model/comment.type';
import {ImageService} from '../services/image.service';
import {LazyImageComponent} from '../shared/lazy-image.component';
import {AuthService} from '../services/auth.service';
import {JamSessionService} from '../services/jam-session.service';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'app-jam-session-page',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatChip,
    NgForOf,
    MapComponent,
    MatIcon,
    SlicePipe,
    DatePipe,
    MatCardModule,
    MatChipSet,
    NgIf,
    MatTableModule,
    MatMiniFabButton,
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
  // Injected services
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private router = inject(Router);
  private commentService = inject(CommentService);
  private imageService = inject(ImageService);
  private authService = inject(AuthService);
  private jamSessionService = inject(JamSessionService);
  dialog = inject(MatDialog);
  
  // Constants
  readonly apiUrls = API_URLS;
  readonly columns: string[] = ["attendee", "instrument", "rating", "page", "actions"];
  readonly ownerColumns: string[] = ["attendee", "instrument", "page"];
  
  // Signals for reactive state
  id = signal<string | null>(null);
  jamSession = signal<any>(null);
  owner = signal<string | undefined>(undefined);
  date = signal<string>('');
  time = signal<string>('');
  coordinates = signal<Leaflet.LatLngExpression>([50.292262, 18.667510]);
  address = signal<string>('');
  user = signal<UserType | undefined>(undefined);
  isLoaded = signal<boolean>(false);
  
  // Comments state
  comments = signal<CommentType[]>([]);
  newCommentText = signal<string>('');
  selectedImageFile = signal<File | null>(null);
  imagePreview = signal<string | ArrayBuffer | null>(null);
  submittingComment = signal<boolean>(false);
  replyingTo = signal<CommentType | null>(null);
  
  readonly reactionTypes = [
    { type: ReactionType.LIKE, emoji: '👍', label: 'Like' },
    { type: ReactionType.LOVE, emoji: '❤️', label: 'Love' },
    { type: ReactionType.HAHA, emoji: '😂', label: 'Laugh' },
    { type: ReactionType.SAD, emoji: '😢', label: 'Sad' },
    { type: ReactionType.ANGRY, emoji: '😠', label: 'Angry' }
  ];
  
  get isAdmin() {
    return this.authService.isAdmin;
  }
  
  // Computed values
  dataSource = computed(() => 
    new MatTableDataSource(this.jamSession()?.confirmedInstruments || [])
  );

  ownerDataSource = computed(() => {
    const session = this.jamSession();
    const ownerData = session?.ownerDto ? [session.ownerDto] : [];
    return new MatTableDataSource(ownerData);
  });

  myConfirmedInstruments = computed(() => {
    const session = this.jamSession();
    const currentUser = this.user();
    if (!session?.confirmedInstruments || !currentUser?.id) return [];
    
    return session.confirmedInstruments.filter(
      (item: any) => item.user?.id === currentUser.id
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
    session.confirmedInstruments?.forEach((item: any) => {
      const name = item.instrument.name;
      if (grouped.has(name)) {
        grouped.get(name)!.confirmed++;
      }
    });
    
    return Array.from(grouped.values());
  });


  constructor() {
    // Initialize with route params
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id.set(routeId);
    
    // Load user data
    const decodedToken: any = jwtDecode(localStorage.getItem('token') || '');
    const loggedInUserId = decodedToken['sub'];
    this.userService.getUserById(loggedInUserId).subscribe(result => {
      this.user.set(result);
      console.log(result);
    });
    
    // Load component data
    this.loadComponent();
  }

  getOwner() {
    const session = this.jamSession();
    if (!session?.ownerDto?.id) return;
    
    this.http.get<any>(`http://localhost:8080/api/users/${session.ownerDto.id}`)
      .subscribe({
        next: (response) => {
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
      alert("You are already signed up for this jam session. You can only sign up for one instrument per session.");
      return;
    }
    
    if (!currentUser?.instrumentsAndRatings?.length) {
      alert("You dont have any instruments listed in your profile");
      return;
    }
    
    const matchingInstrument = currentUser.instrumentsAndRatings.find(
      ir => ir.name === instrument
    );
    
    if (!matchingInstrument || !matchingInstrument.instrumentsAndRatingsId) {
      alert("You dont have this instrument listed in your profile");
      return;
    }
    
    if (!sessionId) return;
    
    this.jamSessionService.joinJamSession(
      parseInt(sessionId), 
      matchingInstrument.instrumentsAndRatingsId
    ).subscribe({
      next: (response) => {
        console.log(response);
        alert("You have successfully signed up for this Jam Session");
        this.loadComponent();
      },
      error: (e) => console.error('Error signing up:', e)
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
      alert("Unable to leave session");
      return;
    }
    this.jamSessionService.leaveJamSession(parseInt(sessionId), currentUser.id).subscribe({
      next: () => {
        alert("You have successfully signed off for this Jam Session");
        this.loadComponent();
      },
      error: (e) => {
        console.error('Error leaving session:', e);
        alert('Failed to leave session');
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
    return session?.ownerDto?.id === currentUser?.id;
  }

  canRemoveParticipant(): boolean {
    return this.isOwner() || this.isAdmin();
  }

  removeParticipant(userId: number, userName: string) {
    const sessionId = this.id();
    if (!sessionId) return;
    
    if (!confirm(`Remove ${userName} from this jam session?`)) return;
    
    this.jamSessionService.leaveJamSession(parseInt(sessionId), userId).subscribe({
      next: () => {
        alert(`${userName} has been removed from the jam session`);
        this.loadComponent();
      },
      error: (e) => {
        console.error('Error removing participant:', e);
        alert('Failed to remove participant');
      }
    });
  }

  private loadComponent() {
    const sessionId = this.id();
    if (!sessionId) return;
    
    this.jamSessionService.getJamSessionById(parseInt(sessionId))
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
          
          console.log(response);
          this.loadComments(sessionId);
        },
        error: (e) => {
          console.error('Error loading component:', e);
        }
      });
  }

  private loadComments(jamSessionId: string) {
    this.commentService.getComments(jamSessionId).subscribe({
      next: (comments) => {
        const commentArray: CommentType[] = Array.isArray(comments) ? comments : Array.from(comments);
        this.comments.set(commentArray);
        console.log(commentArray);
        
        // Preload comment images for better UX
        const imageIds = commentArray
          .map(c => c.imageUrl)
          .filter(id => id != null) as (string | number)[];
        if (imageIds.length > 0) {
          this.imageService.preloadImages(imageIds);
        }
      },
      error: (e) => console.error('Error loading comments:', e)
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
    this.commentService.addComment(
      sessionId, 
      text.trim(), 
      imageFile || undefined,
      parentComment?.id
    ).subscribe({
        next: (created) => {
          if (parentComment) {
            // Add reply to parent comment
            this.comments.update(current => {
              const updateReplies = (comments: CommentType[]): CommentType[] => {
                return comments.map(c => {
                  if (c.id === parentComment.id) {
                    return { ...c, replies: [...c.replies, created] };
                  } else if (c.replies.length > 0) {
                    return { ...c, replies: updateReplies(c.replies) };
                  }
                  return c;
                });
              };
              return updateReplies(current);
            });
          } else {
            // Add as top-level comment
            this.comments.update(current => [created, ...current]);
          }
          this.newCommentText.set('');
          this.selectedImageFile.set(null);
          this.imagePreview.set(null);
          this.submittingComment.set(false);
          this.replyingTo.set(null);
        },
        error: (e) => {
          console.error('Error submitting comment:', e);
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
    this.commentService.reactToMessage(commentId, reactionType).subscribe({
      next: (updatedComment) => {
        // Replace the comment with updated data from backend (handles toggle logic)
        this.comments.update(current => {
          const updateCommentData = (comments: CommentType[]): CommentType[] => {
            return comments.map(c => {
              if (c.id === commentId) {
                // Preserve replies from current state, use updated reaction data from backend
                return { ...updatedComment, replies: c.replies };
              } else if (c.replies.length > 0) {
                return { ...c, replies: updateCommentData(c.replies) };
              }
              return c;
            });
          };
          return updateCommentData(current);
        });
      },
      error: (e) => console.error('Error reacting to comment:', e)
    });
  }

  getReactionEmoji(reactionType: any): string {
    const reaction = this.reactionTypes.find(r => r.type === reactionType);
    return reaction?.emoji || '';
  }

  canReply(comment: CommentType): boolean {
    // Only allow replies to top-level comments (no parent)
    return !comment.parentId;
  }

  deleteComment(comment: CommentType) {
    const sessionId = this.id();
    if (!sessionId) return;
    if (!confirm('Delete this comment?')) return;
    
    this.commentService.deleteComment(sessionId, comment.id).subscribe({
      next: () => {
        this.comments.update(current => {
          const removeComment = (comments: CommentType[]): CommentType[] => {
            return comments
              .filter(c => c.id !== comment.id)
              .map(c => ({
                ...c,
                replies: c.replies.length > 0 ? removeComment(c.replies) : c.replies
              }));
          };
          return removeComment(current);
        });
      },
      error: (e) => console.error('Error deleting comment:', e)
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
