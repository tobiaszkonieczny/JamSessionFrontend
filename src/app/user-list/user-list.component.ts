import {Component, computed, effect, inject, OnInit, signal} from '@angular/core';
import {UserService} from '../services/user.service';
import {UserType} from '../model/user.type';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {Router} from '@angular/router';
import {LazyImageComponent} from '../shared/lazy-image.component';
import {InstrumentsService} from '../services/instruments.service';
import {Instrument} from '../model/jamSession.type';

@Component({
  selector: 'app-user-list',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    LazyImageComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private instrumentsService = inject(InstrumentsService);
  private router = inject(Router);

  // State signals
  allUsers = signal<UserType[]>([]);
  allInstruments = signal<Instrument[]>([]);
  selectedGenre = signal<string | null>(null);
  selectedInstrument = signal<string | null>(null);

  // Filter options
  genreOptions = computed(() => {
    const genres = new Set<string>();
    this.allUsers().forEach(user => {
      user.musicGenres?.forEach(genre => {
        if (genre.name) genres.add(genre.name);
      });
    });
    return Array.from(genres).sort();
  });

  instrumentOptions = computed(() => {
    return this.allInstruments()
      .map(i => i.name)
      .filter((name): name is string => !!name)
      .sort();
  });

  // Filtered users
  filteredUsers = computed(() => {
    const users = this.allUsers();
    const genre = this.selectedGenre();
    const instrumentName = this.selectedInstrument();

    console.log('=== FILTER DEBUG ===');
    console.log('Selected genre:', genre);
    console.log('Selected instrument:', instrumentName);
    console.log('All users count:', users.length);
    console.log('All instruments:', this.allInstruments());

    return users.filter(user => {
      if (genre && !user.musicGenres?.some(g => g.name === genre)) {
        return false;
      }
      if (instrumentName) {
        console.log(`Checking user ${user.name}:`);
        console.log('  User instrumentsAndRatings:', user.instrumentsAndRatings);
        
        // Find the instrument ID from the name
        const selectedInstr = this.allInstruments().find(i => i.name === instrumentName);
        console.log('  Selected instrument object:', selectedInstr);
        
        if (!selectedInstr) {
          console.log('  -> Instrument not found in allInstruments');
          return false;
        }
        
        // Check if user has this instrument by instrumentId
        const hasInstrument = user.instrumentsAndRatings?.some(i => {
          console.log(`    Comparing: user instrument ID ${i.instrumentId} with selected ${selectedInstr.id}`);
          return i.instrumentId === selectedInstr.id;
        });
        console.log('  -> Has instrument:', hasInstrument);
        if (!hasInstrument) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadInstruments();
  }

  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => this.allUsers.set(users),
      error: (err) => console.error('Failed to load users', err)
    });
  }

  loadInstruments(): void {
    this.instrumentsService.getAllInstruments().subscribe({
      next: (instruments) => this.allInstruments.set(instruments),
      error: (err) => console.error('Failed to load instruments', err)
    });
  }

  clearGenre(): void {
    this.selectedGenre.set(null);
  }

  clearInstrument(): void {
    this.selectedInstrument.set(null);
  }

  clearAllFilters(): void {
    this.selectedGenre.set(null);
    this.selectedInstrument.set(null);
  }

  navigateToProfile(userId: number | undefined): void {
    if (userId) {
      this.router.navigate(['/profile'], { queryParams: { userId } });
    }
  }
}
