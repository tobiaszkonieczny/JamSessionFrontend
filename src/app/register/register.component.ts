import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import {NgIf} from '@angular/common';
import {Router} from '@angular/router';
import {routes} from '../app.routes';
import {HttpClient} from '@angular/common/http';
import {catchError, of} from 'rxjs';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatButton,
    NgIf,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  userExists: boolean = false
  statusText: String|undefined
  router: Router = new Router()
  registerForm = new FormGroup(
    {
      name: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
      secondPassword: new FormControl('', [
        Validators.required,
      ]),
    },
    { validators: this.passwordsMatchValidator }
  );

  constructor(private http: HttpClient) {
  }

  async register() {
    if (this.registerForm.valid) {
      this.http.post(
        'http://localhost:8080/api/users/register',
        {
          email: this.registerForm.value.email,
          name: this.registerForm.value.name,
          password: this.registerForm.value.password,
        }
      )
        .subscribe({
          next: (response) => {
            this.router.navigate(['/login']);
          },
          error: (error) => {
            if (error.status === 500) {
              this.statusText = 'User with given email already exists';
              this.userExists = true;
            }
            console.error('Registration failed', error);
          }
        });
    }
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const secondPassword = control.get('secondPassword')?.value;

    return password === secondPassword ? null : { passwordsMismatch: true };
  }
}
