export interface CityRecord {
  id: number;
  name: string;
  asciiName: string;
  latitude: number;
  longitude: number;
  population: number;
  countryCode: string;
  aliases: string[];
}

export interface GuessEntry {
  cityId: number;
  cityName: string;
  newlyCoveredCount: number;
  coveredAfterGuess: number;
}

export type DifficultyKey = "easy" | "medium" | "hard" | "expert";
export type RegionKey =
  | "europe"
  | "us"
  | "canada"
  | "asia"
  | "africa"
  | "southAmerica"
  | "centralAmerica"
  | "oceania"
  | "world";

export interface DifficultyOption {
  key: DifficultyKey;
  label: string;
  radiusKm: number;
}

export interface RegionOption {
  key: RegionKey;
  label: string;
}

export interface PopulationFilterOption {
  value: number;
  label: string;
}

export interface CountryCoverage {
  countryCode: string;
  countryName: string;
  totalCities: number;
  coveredCities: number;
  isComplete: boolean;
}

export interface EuropeCoverageState {
  isActive: boolean;
  isWon: boolean;
  inputValue: string;
  statusMessage: string;
  difficulty: DifficultyKey;
  selectedRegion: RegionKey;
  selectedMinPopulation: number;
  activeRegion: RegionKey;
  activeMinPopulation: number;
  activeRadiusKm: number;
  guessedCityIds: number[];
  coveredCityIds: number[];
  guessHistory: GuessEntry[];
}
