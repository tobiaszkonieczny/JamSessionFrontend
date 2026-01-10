export type UserType = {

  // name: string | undefined;
  // id: number | undefined;
  // bio: string | undefined;
  // imageId: number | undefined
  // musicGenres: { id: number; name: string }[];
  // instrumentsAndRatings: { instrument: string; rating: number }[];
  id: number | undefined,
  name: string | undefined,
  email: string | undefined,
  bio: string | undefined,
  profilePictureId: number | undefined,
  musicGenres: MusicGenre[],
  instrumentsAndRatings: InstrumentsAndRatings[]
}

export type MusicGenre = {
  id: number | undefined,
  name: string | undefined,
}

export type InstrumentsAndRatings = {
  instrumentsAndRatingsId: number | undefined,
  rating: number | undefined
  instrumentId: number | undefined,
  instrumentName: string | undefined,
  userId: number | undefined,
  name: string | undefined, 
}

export type ShortUser = {
  id: number,
  name: string
}
