import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import {NgIf} from '@angular/common';
import {Router} from '@angular/router';
import { AuthApiService } from '../../core/auth/api/auth-api.service';

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
  private router = inject(Router);
  private authApi = inject(AuthApiService);
  
  userExists: boolean = false;
  statusText: String|undefined;
  
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

  register() {
    if (this.registerForm.valid) {
      this.authApi.register(
        this.registerForm.value.email!,
        this.registerForm.value.name!,
        this.registerForm.value.password!
      ).subscribe({
        next: () => {
          this.router.navigate(['/login']);
        },
        error: (error) => {
          if (error.status === 500) {
            this.statusText = 'User with given email already exists';
            this.userExists = true;
          }
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
