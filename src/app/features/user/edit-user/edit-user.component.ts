import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel, MatPrefix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {NgForOf, NgIf} from '@angular/common';
import {MatOption, MatSelect} from '@angular/material/select';
import {catchError, forkJoin, of} from 'rxjs';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import { UserType, InstrumentsAndRating } from '../../../shared/model/user.type';
import { InstrumentsDomainService } from '../../../shared/services/instruments-domain.service';
import { MusicGenresDomainService } from '../../../shared/services/music-genres-domain.service';
import { InstrumentsAndRatingsDomainService } from '../../instrument-and-rating/services/instruments-and-ratings-domain.service';
import { UserDomainService } from '../services/user-domain.service';

@Component({
  selector: 'app-edit-user',
  imports: [
    FormsModule,
    MatButton,
    MatFormField,
    MatInput,
    NgIf,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
    MatLabel,
    NgForOf,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatIcon,
    MatError,
    MatPrefix
  ],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {
  private path = inject(ActivatedRoute);
  private genresDomain = inject(MusicGenresDomainService);
  private userDomain = inject(UserDomainService);
  private router = inject(Router);
  private instrumentsDomain = inject(InstrumentsDomainService);
  private fb = inject(FormBuilder);
  private instrumentsAndRatingsDomain = inject(InstrumentsAndRatingsDomainService);
  private snackBar = inject(MatSnackBar);
  
  editForm: FormGroup = new FormGroup({});
  user = signal<UserType | undefined>(undefined);
  musicGenres = this.genresDomain.genres;
  userId = signal<number | null>(null);
  allInstruments = this.instrumentsDomain.instruments;
  initialInstruments = signal<string[]>([]);
  initialInstrumentsWithIds = signal<Map<string, number>>(new Map());

  get instrumentsArray(): FormArray {
    return this.editForm.get('instruments') as FormArray;
  }

  ngOnInit(): void {
    this.instrumentsDomain.preloadInstruments();
    this.genresDomain.preloadGenres();
    
    this.path.params.subscribe((params) => {
      const userIdFromParam = Number(params['id']);
      this.userId.set(userIdFromParam);
      
      if (this.userId() !== null) {
        this.userDomain.getUserById(this.userId()!).subscribe(user => {
          this.user.set(user);
          this.initialInstruments.set(user?.instrumentsAndRatings?.map(i => i.instrumentName || '') || []);
          const idsMap = new Map<string, number>();
          user?.instrumentsAndRatings?.forEach(i => {
            if (i.instrumentName && i.instrumentsAndRatingsId) {
              idsMap.set(i.instrumentName, i.instrumentsAndRatingsId);
            }
          });
          this.initialInstrumentsWithIds.set(idsMap);
          this.initForm(user);
        });
      }
    });
  }

  onSelectionChange(selectedInstruments: string[]): void {
    if (!this.editForm) return;

    const existingInstrumentNames = this.instrumentsArray.controls.map(
      (control) => control.get('name')?.value
    );

    selectedInstruments.forEach((instrumentName) => {
      if (!existingInstrumentNames.includes(instrumentName)) {
        this.instrumentsArray.push(
          this.fb.group({
            name: new FormControl(instrumentName),
            rating: new FormControl(1, [Validators.min(1), Validators.max(5)]),
          })
        );
      }
    });

    for (let i = this.instrumentsArray.length - 1; i >= 0; i--) {
      const control = this.instrumentsArray.at(i);
      const instrumentName = control.get('name')?.value;
      if (!selectedInstruments.includes(instrumentName)) {
        this.instrumentsArray.removeAt(i);
      }
    }

    this.editForm.get('selectedInstruments')?.setValue(selectedInstruments, {emitEvent: false});
  }

  editUser(): void {
    const formValue = this.editForm.value;
    formValue.genres = formValue.genres.map((genreName: string) => {
      const genre = this.musicGenres().find((g) => g.name === genreName);
      return genre ? genre.id : null;
    });

    const currentInstrumentNames = formValue.instruments.map((i: any) => i.name);
    const removedInstruments: number[] = [];
    this.initialInstrumentsWithIds().forEach((id, name) => {
      if (!currentInstrumentNames.includes(name)) {
        removedInstruments.push(id);
      }
    });

    formValue.instruments = formValue.instruments.map((formValueInstrument: any) => {
      const tempInstrument = this.allInstruments().find((g) => g.name === formValueInstrument.name);
      const returnInstrument: InstrumentsAndRating = {
        instrumentsAndRatingsId: undefined,
        instrumentId: tempInstrument?.id,
        instrumentName: tempInstrument?.name,
        name: this.user()?.name,
        rating: formValueInstrument.rating,
        userId: this.userId() ?? undefined
      }
      return returnInstrument;
    })

    const deleteObservables = removedInstruments.map(id => 
      this.instrumentsAndRatingsDomain.deleteInstrumentAndRating(id).pipe(
        catchError((err: any) => {
          if (err.status === 403) {
            this.snackBar.open(
              'Cannot delete instrument because you are signed up for a session with it',
              'Close',
              {
                duration: 6000,
                horizontalPosition: 'center',
                verticalPosition: 'top',
                panelClass: ['error-snackbar']
              }
            );
          }
          return of(null);
        })
      )
    );

    const deletePhase = deleteObservables.length > 0 
      ? forkJoin(deleteObservables)
      : of([]);

    deletePhase.subscribe(() => {
      forkJoin({
        user: this.userDomain.updateUser(this.userId()!, {
          name: formValue.name,
          email: formValue.email,
          password: formValue.password,
          bio: formValue.bio,
          genres: formValue.genres
        }).pipe(
          catchError(() => of(null))
        ),
        instrumentsAndRatings: this.instrumentsAndRatingsDomain.addInstrumentsAndRatings(this.userId()!, formValue.instruments).pipe(
          catchError((err: any) => {
            if (err.status === 403) {
              this.snackBar.open(
                'Nie można zmienić ratingu, ponieważ jesteś zapisany do sesji z tym instrumentem',
                'Zamknij',
                {
                  duration: 6000,
                  horizontalPosition: 'center',
                  verticalPosition: 'top',
                  panelClass: ['error-snackbar']
                }
              );
            }
            return of(null);
          })
        )
      }).subscribe({
        next: () => {
          this.userDomain.clearUserCache(this.userId()!);
          this.router.navigate(['/profile'], {queryParams: {userId: this.userId()}});
        }
      });
    });
  }

  private initForm(user: UserType): void {
    const selectedInstrumentNames = user?.instrumentsAndRatings?.map(i => i.instrumentName) || []
    this.editForm = this.fb.group({
      name: [user.name, Validators.minLength(3)],
      email: [{value: user.email, disabled: true}, Validators.email],
      password: [null, Validators.minLength(6)],
      secondPassword: [null, Validators.minLength(6)],
      bio: [user.bio, Validators.maxLength(500)],
      genres: [user?.musicGenres.map((g) => g.name) || []],
      instruments: this.fb.array(user?.instrumentsAndRatings?.map(i =>
        this.fb.group({
          name: new FormControl(i.instrumentName),
          rating: new FormControl(i.rating, [Validators.min(1), Validators.max(5)]),
        })
      ) || []),
      selectedInstruments: new FormControl(selectedInstrumentNames),
    }, {validators: this.passwordsMatchValidator});
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const secondPassword = control.get('secondPassword')?.value;

    return password === secondPassword ? null : {passwordsMismatch: true};
  }
}
