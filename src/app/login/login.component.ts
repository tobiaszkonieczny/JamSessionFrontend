import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {NgIf} from "@angular/common";
import {Router} from "@angular/router";
import {MatFormField} from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {jwtDecode} from 'jwt-decode';
import {AuthService} from '../services/auth.service';

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
  forbidden: boolean = false;
  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });

  constructor(private router: Router, private authService: AuthService) {
  }

  login() {
    if (this.loginForm.value.email === '' || this.loginForm.value.password === '') {
      return;
    }
    this.authService.login(this.loginForm.value.email, this.loginForm.value.password)
      .subscribe({
        next: (jwtToken) => {
          localStorage.setItem('token', jwtToken);
          this.forbidden = false;
          const decodedToken = jwtDecode(jwtToken)
          const userId = +(decodedToken['sub'] || '');

          this.router.navigate(['/profile'], {queryParams: {userId: userId}}).then(() => {
            this.authService.autoLogout(decodedToken)
            this.authService.loggedIn()
          });
        },
        error: (err) => {
          if (err.status === 500) {
            this.forbidden = true;
          }
          console.error("Login failed:", err);
          alert("Wrong email or password!");
        }
      });
  }


}
