import {Component, inject, OnInit, signal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel, MatPrefix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButton, MatIconButton} from '@angular/material/button';
import {ActivatedRoute, Router} from "@angular/router";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {NgIf} from '@angular/common';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import { MapComponent } from '../../../shared/components/map/map.component';
import { JamSessionType, Instrument, EditJamSessionDto } from '../model/jamSession.type';
import { JamSessionDomainService } from '../services/jam-session-domain.service';
import { InstrumentsDomainService } from '../../../shared/services/instruments-domain.service';
import { MusicGenresDomainService } from '../../../shared/services/music-genres-domain.service';

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
  private jamSessionDomain = inject(JamSessionDomainService);
  private instrumentsDomain = inject(InstrumentsDomainService);
  private genresDomain = inject(MusicGenresDomainService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  jamSession = signal<JamSessionType | null>(null);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  
  availableInstruments = this.instrumentsDomain.instruments;
  availableGenres = this.genresDomain.genres;
  selectedInstruments: { instrument: Instrument, quantity: number }[] = [];
  selectedCoordinates: { lat: number, lng: number } | null = null;

  jamSessionForm = new FormGroup({
    date: new FormControl('', [Validators.required]),
    time: new FormControl('', [Validators.required]),
    genre: new FormControl<number | null>(null, [Validators.required]),
  });

  ngOnInit(): void {
    this.instrumentsDomain.preloadInstruments();
    this.genresDomain.preloadGenres();
    this.loadJamSession();
  }

  private loadJamSession(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/my-jam-sessions']);
      return;
    }

    const sessionId = parseInt(id);
    this.jamSessionDomain.getAllJamSessions().subscribe({
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
      error: () => {
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

    this.jamSessionDomain.editJamSession(this.jamSession()!.id, editDto).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/my-jam-sessions']);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/my-jam-sessions']);
  }
}
