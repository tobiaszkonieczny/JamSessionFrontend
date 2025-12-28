import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AdminService} from '../services/admin.service';
import {GenreType} from '../model/genre.type';
import {InstrumentType} from '../model/instrument.type';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatList, MatListItem} from '@angular/material/list';
import {MatDivider} from '@angular/material/divider';
import {MatIcon} from '@angular/material/icon';
import {NgForOf} from '@angular/common';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatSnackBar} from '@angular/material/snack-bar';


@Component({
    selector: 'app-admin-panel',
    templateUrl: './admin-panel.component.html',
    styleUrls: ['./admin-panel.component.css'],
    imports: [
        MatCard,
        MatCardTitle,
        MatCardHeader,
        MatCardContent,
        MatInput,
        ReactiveFormsModule,
        MatListItem,
        MatList,
        MatDivider,
        MatFormField,
        MatIcon,
        NgForOf,
        MatButton,
        MatIconButton
    ]
})
export class AdminPanelComponent implements OnInit {
    genreForm: FormGroup | undefined;
    instrumentForm: FormGroup | undefined;
    genres: GenreType[] = [];
    instruments: InstrumentType[] = [];
    success: boolean = false;
    private _snackBar = inject(MatSnackBar);
    private GENRE_IN_USE_MESSAGE = 'This music genre cannot be deleted because it is currently in use';
    private INSTRUMENT_IN_USE_MESSAGE = 'This instrument cannot be deleted because it is currently in use';
    private GENRE_DUPLICATED_MESSAGE = 'CAN NOT ADD THIS GENRE IT ALREADY EXISTS';
    private INSTRUMENT_DUPLICATED_MESSAGE = 'CAN NOT ADD THIS INSTRUMENT IT ALREADY EXISTS';


    constructor(
        private fb: FormBuilder,
        private adminService: AdminService
    ) {
    }

    ngOnInit(): void {
        this.genreForm = this.fb.group({
            genreName: ['', [Validators.required, Validators.minLength(2)]],
        });
        this.instrumentForm = this.fb.group({
            instrumentName: ['', [Validators.required, Validators.minLength(2)]],
        });

        this.loadGenres();
        this.loadInstruments();
    }

    loadGenres(): void {
        this.adminService.getAllGenres().subscribe({
            next: (data: GenreType[]) => {
                this.genres = data.map((genre: GenreType) => genre);
            },
            error: (error) => console.error('Error loading genres', error),
        });
    }

    loadInstruments(): void {
        this.adminService.getAllInstruments().subscribe({
            next: (data: InstrumentType[]) => {
                this.instruments = data.map((instrument: InstrumentType) => instrument);
            },
            error: (error) => console.error('Error loading instruments', error),
        });
    }

    addGenre(): void {
        if (this.genreForm?.invalid) return;
        const genreName = this.genreForm?.value.genreName;
        this.adminService.addGenre(genreName).subscribe({
            next: (newGenre: GenreType) => {
                this.genres.push(newGenre);
                this.genreForm?.reset();
            },
            error: (error) => {
                this._snackBar.open(this.GENRE_DUPLICATED_MESSAGE, "OK")
                console.error('Error adding genre', error)
            },
        });
    }

    addInstrument(): void {
        if (this.instrumentForm?.invalid) return;
        const instrumentName = this.instrumentForm?.value.instrumentName;
        this.adminService.addInstrument(instrumentName).subscribe({
            next: (newInstrument: InstrumentType) => {
                this.instruments.push(newInstrument);
                this.instrumentForm?.reset();
            },
            error: (error) => {
                this._snackBar.open(this.INSTRUMENT_DUPLICATED_MESSAGE, "OK")
                console.error('Error adding instrument', error)
            },
        });
    }

    removeGenre(id: number): void {
        this.adminService.removeGenre(id).subscribe({
            next: () => {
                this.genres = this.genres.filter((g) => g.id !== id);
            },
            error: (error) => {
                console.log(error)
                if (error.status == 409) {
                    this._snackBar.open(this.GENRE_IN_USE_MESSAGE, "OK")
                }
                console.error('Error deleting genre', error)
            },
        });
    }

    removeInstrument(id: number): void {
        this.adminService.removeInstrument(id).subscribe({
            next: (response) => {
                console.log(response)
                this.instruments = this.instruments.filter((i) => i.id !== id)
            },
            error: (error) => {

                if (error.status == 409) {
                    this._snackBar.open(this.INSTRUMENT_IN_USE_MESSAGE, "OK")
                }
                console.error('Error deleting instrument', error)
            },
        });
    }
}
