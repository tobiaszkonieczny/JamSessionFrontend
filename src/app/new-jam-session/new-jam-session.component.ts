import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {HttpClient} from '@angular/common/http';
import {MatOption, MatSelect} from '@angular/material/select';
import {MapComponent} from '../map/map.component';
import {MatButton} from '@angular/material/button';
import {Router} from "@angular/router";
import {routes} from "../app.routes";
import {JamSessionListComponent} from '../jam-session-list/jam-session-list.component';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatChipSet, MatChip} from '@angular/material/chips';
import {MatIconButton} from '@angular/material/button';
import {NgIf} from '@angular/common';
import { JamSessionType } from '../model/jamSession.type';

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
    MatChipSet,
    MatChip,
    MatIconButton,
    NgIf
  ],
  templateUrl: './new-jam-session.component.html',
  styleUrl: './new-jam-session.component.css'
})

export class NewJamSessionComponent {
    jamSessionForm = new FormGroup(
        {
            date: new FormControl('', [
                Validators.required
            ]),
            time: new FormControl('', [
                Validators.required
            ]),
            genre: new FormControl('', [
                Validators.required
            ]),
        }
    )

    instrumentsAsObjects: any[] = []
    availableInstruments: any[] = []
    selectedInstruments: { instrument: any, quantity: number }[] = []
    selectedCoordinates: { lat: number, lng: number } | null = null;
    genresAsObjects: any[] = []
    genres: any[] = []
    lat: number | undefined
    lng: number | undefined
    address: string | undefined

    onCoordinatesSelected(coordinates: { lat: number, lng: number }) {
        this.selectedCoordinates = coordinates;
        this.getAddress(coordinates.lat, coordinates.lng)
    }

    constructor(private http: HttpClient, private router: Router) {
    }

    ngOnInit() {
        this.http.get('http://localhost:8080/api/instruments/all')
            .subscribe({
                next: (response: any) => {
                    console.log(response)
                    response.forEach((elem: any) => {
                        this.instrumentsAsObjects.push(elem)
                        this.availableInstruments.push(elem.name)
                    })
                },
                error: (e) => {
                    console.error(e)
                }
            })
        this.http.get('http://localhost:8080/api/genres/all')
            .subscribe({
                next: (response: any) => {
                    response.forEach((genre: any) => {
                        this.genresAsObjects.push(genre)
                        this.genres.push(genre.name!)
                    })
                },
                error: (e) => {
                    console.error(e)
                }
            })
    }

    addInstrument(instrumentName: string) {
        const instrument = this.instrumentsAsObjects.find(i => i.name === instrumentName);
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
        const requiredInstruments: any[] = [];
        this.selectedInstruments.forEach(si => {
            for (let i = 0; i < si.quantity; i++) {
                requiredInstruments.push({
                    id: si.instrument.id,
                    name: si.instrument.name
                });
            }
        });
        
        let genre: any = {};
        this.genresAsObjects.forEach(g=>{
            if(g.name==this.jamSessionForm.value.genre){
                genre=g
            }
        })
        console.log("genreid"+genre.id)
        this.http.post<JamSessionType>(
            'http://localhost:8080/api/jam/create',
            {
                "startTime": `${this.jamSessionForm.value.date}T${this.jamSessionForm.value.time}:00`,
                "location": {
                    "latitude": this.selectedCoordinates?.lat,
                    "longitude": this.selectedCoordinates?.lng
                },
                "requiredInstruments": requiredInstruments,
                "musicGenreId": genre.id
            },
            {
                observe: 'response'
            }
        )
            .subscribe({
                next: (response) => {
                    this.router.navigate(['/jam-session-page', response.body?.id]);
                },
                error: (error) => {
                    console.log(error)
                }
            })
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
