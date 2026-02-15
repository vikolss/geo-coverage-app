import type {
  DifficultyOption,
  PopulationFilterOption,
  RegionKey,
  RegionOption
} from "@/games/europe-coverage/types";

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { key: "easy", label: "Easy (500 km)", radiusKm: 500 },
  { key: "medium", label: "Medium (200 km)", radiusKm: 200 },
  { key: "hard", label: "Hard (100 km)", radiusKm: 100 },
  { key: "expert", label: "Expert (50 km)", radiusKm: 50 }
];

export const DEFAULT_DIFFICULTY = DIFFICULTY_OPTIONS[0];

export const REGION_OPTIONS: RegionOption[] = [
  { key: "europe", label: "Europe" },
  { key: "us", label: "United States" }
];

export const DEFAULT_REGION = REGION_OPTIONS[0];

export const POPULATION_FILTER_OPTIONS: PopulationFilterOption[] = [
  { value: 10000, label: "10k" },
  { value: 25000, label: "25k" },
  { value: 100000, label: "100k" },
  { value: 500000, label: "500k" }
];

export const DEFAULT_POPULATION_FILTER = POPULATION_FILTER_OPTIONS[1];

export interface RegionMapConfig {
  center: google.maps.LatLngLiteral;
  bounds: google.maps.LatLngBoundsLiteral;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
}

export const REGION_MAP_CONFIG: Record<RegionKey, RegionMapConfig> = {
  europe: {
    center: { lat: 52.0, lng: 12.0 },
    bounds: { north: 72.0, south: 30.0, west: -25.0, east: 45.0 },
    minZoom: 3,
    maxZoom: 8,
    defaultZoom: 4
  },
  us: {
    center: { lat: 39.8, lng: -98.6 },
    bounds: { north: 49.5, south: 24.3, west: -125.0, east: -66.7 },
    minZoom: 3,
    maxZoom: 8,
    defaultZoom: 4
  }
};
export const EUROPE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }]
  }
];
