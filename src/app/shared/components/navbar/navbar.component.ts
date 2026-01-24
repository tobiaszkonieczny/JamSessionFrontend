import {Component, OnInit, inject, computed} from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';
import {Router, RouterLink} from '@angular/router';
import { AuthDomainService } from '../../../core/auth/services/auth-domain.service';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbar,
    MatButton,
    MatIconButton,
    RouterLink,
    MatIcon
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);
  authDomain = inject(AuthDomainService);
  
  mobileMenuOpen = false;

  isAdmin = computed(() => this.authDomain.isAdmin());
  currentUserId = computed(() => this.authDomain.currentUserId());
  isLoggedIn = computed(() => this.authDomain.isLoggedIn());

  ngOnInit(): void {
  }

  logOut() {
    const userId = this.authDomain.currentUserId();
    if (userId) {
      this.authDomain.logout(true);
    }
  }

  signedUpSessions() {
    const userId = this.currentUserId();
    if (userId) {
      this.router.navigate(['/signed-up-jam-sessions'], {queryParams: {userId: userId}});
    }
  }

  profileButton() {
    const userId = this.currentUserId();
    if (userId) {
      this.router.navigate(['/profile'], {queryParams: {userId: userId}});
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}

