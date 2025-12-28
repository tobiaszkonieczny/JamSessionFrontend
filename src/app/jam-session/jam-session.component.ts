import {Component} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {MatButton} from '@angular/material/button';
import {JamSessionListComponent} from "../jam-session-list/jam-session-list.component";
import {MatIcon} from '@angular/material/icon';
import {Router} from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {
  }

  newJam() {
    this.router.navigate(['/new-jam-session']);
  }
}
