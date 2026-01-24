import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatInput} from '@angular/material/input';
import {MatList, MatListItem} from '@angular/material/list';
import {MatDivider} from '@angular/material/divider';
import {MatIcon} from '@angular/material/icon';
import {NgForOf} from '@angular/common';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MusicGenre } from '../../../shared/model/user.type';
import { Instrument } from '../../jam-session/model/jamSession.type';
import { AdminDomainService } from '../services/admin-domain.service';
import { MusicGenresDomainService } from '../../../shared/services/music-genres-domain.service';
import { InstrumentsDomainService } from '../../../shared/services/instruments-domain.service';

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
        MatButton,
        MatIconButton
    ]
})
export class AdminPanelComponent implements OnInit {
    private readonly adminDomain = inject(AdminDomainService);
    private readonly musicGenresDomain = inject(MusicGenresDomainService);
    private readonly instrumentsDomain = inject(InstrumentsDomainService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly fb = inject(FormBuilder);

    genreForm!: FormGroup;
    instrumentForm!: FormGroup;
    genres = signal<MusicGenre[]>([]);
    instruments = signal<Instrument[]>([]);

    readonly isAddingGenre = this.adminDomain.isAddingGenre;
    readonly isAddingInstrument = this.adminDomain.isAddingInstrument;
    readonly isRemovingGenre = this.adminDomain.isRemovingGenre;
    readonly isRemovingInstrument = this.adminDomain.isRemovingInstrument;

    private readonly GENRE_IN_USE_MESSAGE = 'This music genre cannot be deleted because it is currently in use';
    private readonly INSTRUMENT_IN_USE_MESSAGE = 'This instrument cannot be deleted because it is currently in use';
    private readonly GENRE_DUPLICATED_MESSAGE = 'CAN NOT ADD THIS GENRE IT ALREADY EXISTS';
    private readonly INSTRUMENT_DUPLICATED_MESSAGE = 'CAN NOT ADD THIS INSTRUMENT IT ALREADY EXISTS';

    ngOnInit(): void {
        this.initializeForms();
        this.loadGenres();
        this.loadInstruments();
    }

    private initializeForms(): void {
        this.genreForm = this.fb.group({
            genreName: ['', [Validators.required, Validators.minLength(2)]],
        });
        this.instrumentForm = this.fb.group({
            instrumentName: ['', [Validators.required, Validators.minLength(2)]],
        });
    }

    private loadGenres(): void {
        this.musicGenresDomain.getAllGenres().subscribe({
            next: (data) => this.genres.set(data),
            error: (error) => console.error('Error loading genres', error),
        });
    }

    private loadInstruments(): void {
        this.instrumentsDomain.getAllInstruments().subscribe({
            next: (data) => this.instruments.set(data),
            error: (error) => console.error('Error loading instruments', error),
        });
    }

    addGenre(): void {
        if (this.genreForm.invalid) return;
        
        const genreName = this.genreForm.value.genreName;
        this.adminDomain.addGenre(genreName).subscribe({
            next: (newGenre) => {
                this.genres.update(genres => [...genres, newGenre]);
                this.genreForm.reset();
                this.musicGenresDomain.clearCache();
            },
            error: (error) => {
                this.snackBar.open(this.GENRE_DUPLICATED_MESSAGE, 'OK');
                console.error('Error adding genre', error);
            },
        });
    }

    addInstrument(): void {
        if (this.instrumentForm.invalid) return;
        
        const instrumentName = this.instrumentForm.value.instrumentName;
        this.adminDomain.addInstrument(instrumentName).subscribe({
            next: (newInstrument) => {
                this.instruments.update(instruments => [...instruments, newInstrument]);
                this.instrumentForm.reset();
                this.instrumentsDomain.clearCache();
            },
            error: (error) => {
                this.snackBar.open(this.INSTRUMENT_DUPLICATED_MESSAGE, 'OK');
                console.error('Error adding instrument', error);
            },
        });
    }

    removeGenre(id: number): void {
        this.adminDomain.removeGenre(id).subscribe({
            next: () => {
                this.genres.update(genres => genres.filter(g => g.id !== id));
                this.musicGenresDomain.clearCache();
            },
            error: (error) => {
                if (error.status === 409) {
                    this.snackBar.open(this.GENRE_IN_USE_MESSAGE, 'OK');
                }
                console.error('Error deleting genre', error);
            },
        });
    }

    removeInstrument(id: number): void {
        this.adminDomain.removeInstrument(id).subscribe({
            next: () => {
                this.instruments.update(instruments => instruments.filter(i => i.id !== id));
                this.instrumentsDomain.clearCache();
            },
            error: (error) => {
                if (error.status === 409) {
                    this.snackBar.open(this.INSTRUMENT_IN_USE_MESSAGE, 'OK');
                }
                console.error('Error deleting instrument', error);
            },
        });
    }
}
