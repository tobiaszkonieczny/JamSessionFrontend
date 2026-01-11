import {Component, OnInit} from '@angular/core';
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
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {NgForOf, NgIf} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {UserService} from '../services/user.service';
import {InstrumentsAndRating, MusicGenre, UserType} from '../model/user.type';
import {MusicGenresService} from '../services/music-genres.service';
import {MatOption, MatSelect} from '@angular/material/select';
import {catchError, forkJoin, of} from 'rxjs';
import {Instrument} from "../model/jamSession.type";
import {InstrumentsService} from "../services/instruments.service";
import {InstrumentsAndRatingsService} from "../services/instruments-and-ratings.service";

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
    NgForOf
  ],
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent implements OnInit {
  editForm: FormGroup = new FormGroup({});
  user: UserType | undefined;
  musicGenres: MusicGenre[] | undefined;
  userId: number | undefined;
  allInstruments: Instrument[] = [];

  constructor(
    private path: ActivatedRoute,
    private http: HttpClient,
    private genresService: MusicGenresService,
    private userService: UserService,
    private router: Router,
    private instrumentsService: InstrumentsService,
    private fb: FormBuilder,
    private instrumentsAndRatingsService: InstrumentsAndRatingsService
  ) {
  }

  get instrumentsArray(): FormArray {
    return this.editForm.get('instruments') as FormArray;
  }

  ngOnInit(): void {
    this.path.params.subscribe((params) => {
      this.userId = params['id'];
    });

    if (this.userId) {
      forkJoin({
        user: this.userService.getUserById(this.userId),
        genres: this.genresService.getAllGenres(),
        instruments: this.instrumentsService.getAllInstruments(),
      }).subscribe(({user, genres, instruments}) => {
        this.user = user;
        this.musicGenres = genres;
        this.allInstruments = instruments;
        this.initForm(user);
      });
    }
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
      if (!selectedInstruments.includes(control.get('name')?.value)) {
        this.instrumentsArray.removeAt(i);
      }
    }
  }

  editUser(): void {
    const formValue = this.editForm.value;
    formValue.genres = formValue.genres.map((genreName: string) => {
      const genre = this.musicGenres?.find((g) => g.name === genreName);
      return genre ? genre.id : null;
    });


    formValue.instruments = formValue.instruments.map((formValueInstrument: any) => {
      const tempInstrument = this.allInstruments.find((g) => g.name === formValueInstrument.name);
      const returnInstrument: InstrumentsAndRating = {
        instrumentsAndRatingsId: undefined,
        instrumentId: tempInstrument?.id,
        instrumentName: tempInstrument?.name,
        name: this.user?.name,
        rating: formValueInstrument.rating,
        userId: this.userId
      }
      console.log(returnInstrument);
      return returnInstrument;
    })


    forkJoin({
      user: this.userService.updateUser(formValue, this.userId!).pipe(
        catchError((err: any) => {
          console.error('User update failed:', err);
          return of(null);
        })
      ),
      instrumentsAndRatings: this.instrumentsAndRatingsService.addInstrumentsAndRatings(formValue.instruments).pipe(
        catchError((err: any) => {
          console.error('Adding instruments failed:', err);
          return of(null);
        })
      )
    }).subscribe({
      next: (result: { user: any; instrumentsAndRatings: any }) => {
        console.log(result);
        if (result.user) this.userService.clearUserCache(this.userId!);
        this.router.navigate(['/profile'], {queryParams: {userId: this.userId}});
      },
      error: (err: any) => {
        console.error('Error in forkJoin:', err);
      }
    });
  }

  private initForm(user: UserType): void {
    console.log(user);
    const selectedInstrumentNames = user?.instrumentsAndRatings?.map(i => i.instrumentName) || []
    this.editForm = this.fb.group({
      name: [user.name, Validators.minLength(3)],
      email: [user.email, Validators.email],
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
