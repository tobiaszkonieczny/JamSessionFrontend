import {Component, NgModule} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {UserProfileComponent} from './user-profile/user-profile.component';
import {LoginComponent} from './login/login.component';
import {ReactiveFormsModule} from '@angular/forms';
import {NavbarComponent} from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'SpringJamFrontend';
}
