import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel, MatPrefix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MapComponent} from '../map/map.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {ActivatedRoute, Router} from "@angular/router";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {NgIf} from '@angular/common';
import {JamSessionService} from '../services/jam-session.service';
import {InstrumentsService} from '../services/instruments.service';
import {HttpClient} from '@angular/common/http';
import {EditJamSessionDto, Instrument, JamSessionType} from '../model/jamSession.type';
import {MusicGenre} from '../model/user.type';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-jam-session',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatSelect,
    MatOption,
    MapComponent,
    MatButton,
    MatCardContent,
    MatCardTitle,
    MatCardHeader,
    MatCard,
    MatLabel,
    MatIcon,
    NgIf,
    MatProgressSpinner,
    MatIconButton,
    MatPrefix
  ],
  templateUrl: './edit-jam-session.component.html',
  styleUrl: './edit-jam-session.component.css'
})
export class EditJamSessionComponent implements OnInit {
  private jamSessionService = inject(JamSessionService);
  private instrumentsService = inject(InstrumentsService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // State signals
  jamSession = signal<JamSessionType | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  
  // Form data
  availableInstruments = signal<Instrument[]>([]);
  availableGenres = signal<MusicGenre[]>([]);
  selectedInstruments: { instrument: Instrument, quantity: number }[] = [];
  selectedCoordinates: { lat: number, lng: number } | null = null;

  jamSessionForm = new FormGroup({
    date: new FormControl('', [Validators.required]),
    time: new FormControl('', [Validators.required]),
    genre: new FormControl<number | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.loadFormData();
    this.loadJamSession();
  }

  private loadFormData(): void {
    // Load instruments
    this.instrumentsService.getAllInstruments().subscribe({
      next: (instruments) => this.availableInstruments.set(instruments),
      error: (e) => console.error('Error loading instruments', e)
    });

    // Load genres
    this.http.get<MusicGenre[]>('http://localhost:8080/api/genres/all').subscribe({
      next: (genres) => this.availableGenres.set(genres),
      error: (e) => console.error('Error loading genres', e)
    });
  }

  private loadJamSession(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/my-jam-sessions']);
      return;
    }

    // Get jam session details from the list by navigating with state, or fetch from API
    const sessionId = parseInt(id);
    this.jamSessionService.getAllJamSessions().subscribe({
      next: (sessions) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
          this.jamSession.set(session);
          this.populateForm(session);
          this.isLoading.set(false);
        } else {
          console.error('Session not found');
          this.router.navigate(['/my-jam-sessions']);
        }
      },
      error: (e) => {
        console.error('Error loading jam session', e);
        this.router.navigate(['/my-jam-sessions']);
      }
    });
  }

  private populateForm(session: JamSessionType): void {
    const startDate = new Date(session.startTime);
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toTimeString().slice(0, 5);

    this.jamSessionForm.patchValue({
      date: dateStr,
      time: timeStr,
      genre: session.musicGenre.id ?? null
    });

    // Group required instruments by type and count
    const instrumentCounts = new Map<number, number>();
    session.requiredInstruments.forEach(inst => {
      instrumentCounts.set(inst.id, (instrumentCounts.get(inst.id) || 0) + 1);
    });

    // Convert to selectedInstruments format
    this.selectedInstruments = [];
    instrumentCounts.forEach((quantity, id) => {
      const instrument = this.availableInstruments().find(i => i.id === id);
      if (instrument) {
        this.selectedInstruments.push({ instrument, quantity });
      }
    });

    this.selectedCoordinates = {
      lat: session.location.latitude,
      lng: session.location.longitude
    };
  }

  onCoordinatesSelected(coordinates: { lat: number, lng: number }): void {
    this.selectedCoordinates = coordinates;
  }

  addInstrument(instrumentId: number): void {
    const instrument = this.availableInstruments().find(i => i.id === instrumentId);
    if (!instrument) return;
    
    const existing = this.selectedInstruments.find(si => si.instrument.id === instrumentId);
    if (existing) {
      existing.quantity++;
    } else {
      this.selectedInstruments.push({ instrument, quantity: 1 });
    }
  }

  removeInstrument(index: number): void {
    this.selectedInstruments.splice(index, 1);
  }

  increaseQuantity(index: number): void {
    this.selectedInstruments[index].quantity++;
  }

  decreaseQuantity(index: number): void {
    if (this.selectedInstruments[index].quantity > 1) {
      this.selectedInstruments[index].quantity--;
    }
  }

  isFormValid(): boolean {
    return this.jamSessionForm.valid && this.selectedCoordinates !== null && this.selectedInstruments.length > 0;
  }

  update(): void {
    if (!this.isFormValid() || !this.jamSession()) {
      console.error('Form is invalid or coordinates not selected');
      return;
    }

    this.isSaving.set(true);

    const formValue = this.jamSessionForm.value;
    const dateTimeString = `${formValue.date}T${formValue.time}:00`;

    // Build required instruments array with quantities
    const requiredInstruments: number[] = [];
    this.selectedInstruments.forEach(si => {
      for (let i = 0; i < si.quantity; i++) {
        requiredInstruments.push(si.instrument.id);
      }
    });

    const editDto: EditJamSessionDto = {
      requiredInstrumentsIds: requiredInstruments,
      startTime: dateTimeString,
      location: {
        latitude: this.selectedCoordinates!.lat,
        longitude: this.selectedCoordinates!.lng
      },
      musicGenreId: formValue.genre || undefined
    };

    this.jamSessionService.editJamSession(this.jamSession()!.id, editDto).subscribe({
      next: () => {
        console.log('Jam session updated successfully');
        this.isSaving.set(false);
        this.router.navigate(['/my-jam-sessions']);
      },
      error: (e) => {
        console.error('Error updating jam session', e);
        this.isSaving.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/my-jam-sessions']);
  }
}
