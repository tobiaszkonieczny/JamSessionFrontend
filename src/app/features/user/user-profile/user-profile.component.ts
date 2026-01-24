import {Component, inject, signal, computed} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import { UserType } from '../../../shared/model/user.type';
import { UserDomainService } from '../services/user-domain.service';
import { AuthDomainService } from '../../../core/auth/services/auth-domain.service';
import { ImageService } from '../../../shared/services/image-domain.service';

@Component({
  selector: 'app-user-profile',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatChipSet,
    MatCardContent,
    MatProgressBar,
    MatChip,
    MatButton,
    MatIcon
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.css'
})
export class UserProfileComponent {
  private router = inject(Router);
  private userDomain = inject(UserDomainService);
  private authDomain = inject(AuthDomainService);
  private route = inject(ActivatedRoute);
  private imageService = inject(ImageService);
  private snackBar = inject(MatSnackBar);
  
  userPictureUrl = signal<string>("/default-user-image.png");
  user = signal<UserType | undefined>(undefined);
  loggedInUserId = signal<number | null>(null);
  paramId = signal<number | null>(null);
  isChangePossible = computed(() => 
    this.paramId() !== null && 
    this.loggedInUserId() !== null && 
    this.paramId() === this.loggedInUserId()
  );

  ngOnInit() {
    this.loggedInUserId.set(this.authDomain.currentUserId() || null);
    if (this.loggedInUserId() !== null) {
      this.route.queryParams.subscribe(params => {
        const userIdFromParam = Number(params['userId']);
        this.paramId.set(userIdFromParam);
        this.loadUser();
      });
    }
  }

  onEditButtonClick() {
    this.router.navigate(['profile/' + this.user()?.id + '/edit']);
  }

  onEditImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const image = input.files[0];

      const allowedExtensions = ['jpg', 'png', 'jpeg'];
      const fileExtension = image.name.split('.').pop()?.toLowerCase();

      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        this.userDomain.updateUserImage(this.loggedInUserId()!, image).subscribe({
          next: () => {
            this.snackBar.open('Profile image updated successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
            this.loadUser();
          },
          error: () => {
            this.snackBar.open('Error updating image', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar']
            });
          }
        })
      } else {
        this.snackBar.open('Wrong file format! Only JPG, PNG or JPEG are allowed', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        input.value = '';
      }
    }
  }

  private loadUser() {
    const userId = this.paramId();
    if (userId === null) return;
    
    this.userDomain.getUserById(userId).subscribe({
      next: (user: UserType) => {
        this.user.set(user);
        if (user?.profilePictureId) {
          this.imageService.getImageAsDataUrl(`images/${user.profilePictureId}`).subscribe(dataUrl => {
            if (dataUrl) {
              this.userPictureUrl.set(dataUrl);
            }
          });
        }
      },
      error: () => {
        this.snackBar.open('Error loading user profile', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
