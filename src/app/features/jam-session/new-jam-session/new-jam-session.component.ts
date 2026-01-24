import {Component, inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {HttpClient} from '@angular/common/http';
import {MatOption, MatSelect} from '@angular/material/select';
import {MapComponent} from '../../../shared/components/map/map.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {Router} from "@angular/router";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {NgIf} from '@angular/common';
import { Instrument, JamSessionType } from '../model/jamSession.type';
import { JamSessionDomainService } from '../services/jam-session-domain.service';
import { InstrumentsDomainService } from '../../../shared/services/instruments-domain.service';
import { MusicGenresDomainService } from '../../../shared/services/music-genres-domain.service';
import { MusicGenre } from '../../../shared/model/user.type';

@Component({
  selector: 'app-new-jam-session',
  imports: [
    FormsModule,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
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
    MatIconButton,
    NgIf
  ],
  templateUrl: './new-jam-session.component.html',
  styleUrl: './new-jam-session.component.css'
})

export class NewJamSessionComponent implements OnInit {
    private jamSessionDomain = inject(JamSessionDomainService);
    private instrumentsDomain = inject(InstrumentsDomainService);
    private genresDomain = inject(MusicGenresDomainService);
    private http = inject(HttpClient);
    private router = inject(Router);

    jamSessionForm = new FormGroup({
        date: new FormControl('', [Validators.required]),
        time: new FormControl('', [Validators.required]),
        genre: new FormControl<number | null>(null, [Validators.required]),
    });

    availableInstruments = this.instrumentsDomain.instruments;
    availableGenres = this.genresDomain.genres;
    selectedInstruments: { instrument: Instrument, quantity: number }[] = [];
    selectedCoordinates: { lat: number, lng: number } | null = null;
    lat: number | undefined;
    lng: number | undefined;
    address: string | undefined;

    onCoordinatesSelected(coordinates: { lat: number, lng: number }) {
        this.selectedCoordinates = coordinates;
        this.getAddress(coordinates.lat, coordinates.lng);
    }

    ngOnInit() {
        this.instrumentsDomain.preloadInstruments();
        this.genresDomain.preloadGenres();
    }

    addInstrument(instrumentId: number) {
        const instrument = this.availableInstruments().find(i => i.id === instrumentId);
        if (!instrument) return;
        
        const existing = this.selectedInstruments.find(si => si.instrument.id === instrument.id);
        if (existing) {
            existing.quantity++;
        } else {
            this.selectedInstruments.push({ instrument, quantity: 1 });
        }
    }

    removeInstrument(index: number) {
        this.selectedInstruments.splice(index, 1);
    }

    increaseQuantity(index: number) {
        this.selectedInstruments[index].quantity++;
    }

    decreaseQuantity(index: number) {
        if (this.selectedInstruments[index].quantity > 1) {
            this.selectedInstruments[index].quantity--;
        }
    }

    isFormValid(): boolean {
        return this.jamSessionForm.valid && this.selectedCoordinates !== null && this.selectedInstruments.length > 0;
    }

    create() {
       const requiredInstruments: { id: number }[] = [];
        this.selectedInstruments.forEach(si => {
            for (let i = 0; i < si.quantity; i++) {
                requiredInstruments.push({ id: si.instrument.id });
            }
        });
        
        const formValue = this.jamSessionForm.value;
        
        this.jamSessionDomain.createJamSession({
            startTime: `${formValue.date}T${formValue.time}:00`,
            location: {
                latitude: this.selectedCoordinates!.lat,
                longitude: this.selectedCoordinates!.lng
            },
            requiredInstruments: requiredInstruments,
            musicGenreId: formValue.genre!
        }).subscribe({
            next: (jamSession) => {
                this.router.navigate(['/jam-session-page', jamSession.id]);
            }
        });
    }
  getAddress(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    this.http.get<any>(url).subscribe({
      next: (response) => {
        const road = response.address.road || 'Unknown road';
        const houseNumber = response.address.house_number || 'No number';
        const city = response.address.village|| response.address.city || response.address.town || 'Unknown city';
        this.lat = lat;
        this.lng = lng;
        this.address = `${road}, ${houseNumber}, ${city}`
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }
}
