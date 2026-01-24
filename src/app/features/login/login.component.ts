import {Component, inject} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {MatFormField} from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import { AuthDomainService } from '../../core/auth/services/auth-domain.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatFormField,
    MatButton,
    MatInput
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private router = inject(Router);
  private authDomain = inject(AuthDomainService);
  
  forbidden: boolean = false;
  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });

  login() {
    if (this.loginForm.value.email === '' || this.loginForm.value.password === '') {
      return;
    }
    this.authDomain.login(this.loginForm.value.email!, this.loginForm.value.password!)
      .subscribe({
        next: () => {
          this.forbidden = false;
          const userId = this.authDomain.currentUserId();
          if (userId) {
            this.router.navigate(['/profile'], {queryParams: {userId: userId}});
          } else {
            this.router.navigate(['/jam-session']);
          }
        },
        error: () => {
          this.forbidden = true;
        }
      });
  }
}
