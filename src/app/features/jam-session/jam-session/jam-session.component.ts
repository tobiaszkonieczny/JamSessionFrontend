import {Component, inject} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';
import { JamSessionListComponent } from '../jam-session-list/jam-session-list.component';

@Component({
  selector: 'app-jamsession',
  imports: [
    MatButton,
    JamSessionListComponent,
    MatIcon
  ],
  templateUrl: './jam-session.component.html',
  styleUrl: './jam-session.component.css'
})
export class JamSessionComponent {
  private readonly router = inject(Router);

  newJam(): void {
    this.router.navigate(['/new-jam-session']);
  }
}
