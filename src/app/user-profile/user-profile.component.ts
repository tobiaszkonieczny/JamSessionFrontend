import {ChangeDetectorRef, Component, NgZone} from '@angular/core';
import {jwtDecode} from "jwt-decode";
import {ActivatedRoute, Router} from "@angular/router";
import {NgForOf, NgIf} from "@angular/common";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {MatDivider} from '@angular/material/divider';
import {MatList, MatListItem} from '@angular/material/list';
import {MatProgressBar} from '@angular/material/progress-bar';
import {HttpClient} from '@angular/common/http';
import {UserService} from '../services/user.service';
import {UserType} from '../model/user.type';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

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
  token: string;
  userPictureUrl: string = "/default-user-image.png";
  user: UserType | undefined;
  loggedInUserId: number = -1;
  isChangePossible: boolean = false;
  paramId: number = -1;

  constructor(private http: HttpClient, private router: Router, private userService: UserService,
              private route: ActivatedRoute, private cdr: ChangeDetectorRef, private ngZone: NgZone) {
    this.token = localStorage.getItem('token') || '';
  }

  ngOnInit() {
    if (this.token !== '') {
      const decodedToken: any = jwtDecode(this.token);
      this.loggedInUserId = decodedToken['sub'];
      this.route.queryParams.subscribe(params => {
        this.paramId = params['userId'];
        this.loadUser();
        this.isChangePossible = this.paramId === this.loggedInUserId;
      });
    }
  }

  getUserPicture(imageId: number) {
    return this.http.get(`http://localhost:8080/api/images/${imageId}`, {responseType: 'blob'});
  }

  onEditButtonClick() {
    this.router.navigate(['profile/' + this.user?.id + '/edit']);
  }

  onEditImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const image = input.files[0];

      const allowedExtensions = ['jpg', 'png', 'jpeg'];
      const fileExtension = image.name.split('.').pop()?.toLowerCase();

      if (fileExtension && allowedExtensions.includes(fileExtension)) {
        console.log('Wybrano plik:', image.name);
        this.userService.updateUserImage(image).subscribe({
          next: response => {
            alert("Profile image updated successfully");
            this.userService.clearUserCache(this.loggedInUserId);
            this.ngZone.run(() => {
              this.loadUser()
            })
          },
          error: error => {
            console.error("Error sending image", error);
            alert("Error sending image");
          }
        })
      } else {
        alert('Wrong file format! Only JPG, PNG lub JPEG are allowed!');
        input.value = '';
      }
    }
  }

  private loadUser() {
    this.userService.getUserById(this.paramId).subscribe({
      next: (user: UserType) => {
        console.log(user)
        this.user = user;
        if (this.user?.profilePictureId) {
          this.getUserPicture(this.user.profilePictureId).subscribe(image => {
            if (image) {
              this.userPictureUrl = URL.createObjectURL(image);
            }
          });
        }
        this.cdr.detectChanges()
      },
      error: err => {
        console.error("Getting user error", err);
      }
    });

  }
}
