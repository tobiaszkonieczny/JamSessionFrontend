import {InstrumentsAndRating, MusicGenre, ShortUser} from '../../../shared/model/user.type';

export type JamSessionType = {
  id: number,
  owner: ShortUser,
  confirmedInstruments: InstrumentsAndRating[]
  startTime: string,
  location: Location,
  requiredInstruments: Instrument[],
  musicGenre: MusicGenre
}

export type Location = {
  latitude: number,
  longitude: number
}

export type Instrument = {
  id: number,
  name: string,
}

export type EditJamSessionDto = {
  confirmedInstrumentsIds?: number[],
  requiredInstrumentsIds?: number[],
  startTime?: string,
  location?: Location,
  musicGenreId?: number
}
