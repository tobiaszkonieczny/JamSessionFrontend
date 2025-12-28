import {Component, OnInit} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../services/user.service';
import {jwtDecode} from 'jwt-decode';
import {JwtPayload} from '../model/JwtPayload';
import {AuthService} from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbar,
    MatButton,
    RouterLink,
    MatIcon
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  token: string = '';
  userId: number = 0;
  router: Router = new Router()

  constructor(private userService: UserService, public authService: AuthService) {
  }

  get isAdmin() {
    return this.authService.isAdmin;
  }

  get currentUser(){
    return this.authService.getCurrentUser()?.id;
  }

  get noToken(): boolean {
    return !localStorage.getItem('token');
  }


  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(() => {
      this.initNavbar();
    })
    this.initNavbar();
  }

  logOut() {
    if (this.token !== undefined) {
      localStorage.removeItem('token')
      this.userService.clearUserCache(this.userId);
      this.authService.isAdmin.set(false);
      this.userId = 0;
      this.token = '';
      this.router.navigate(['/login'])
    }
  }

  signedUpSessions() {
    this.router.navigate(['/signed-up-jam-sessions'], {queryParams: {userId: this.userId}});
  }

  profileButton() {
    this.initNavbar()
    this.router.navigate(['/profile'], {queryParams: {userId: this.userId}});
  }

  private initNavbar() {
    this.token = localStorage.getItem('token') || ''
    const decodedToken = jwtDecode<JwtPayload>(this.token)
    this.userId = +(decodedToken['sub'] || '');
    this.authService.checkAdminStatus();
  }
}

