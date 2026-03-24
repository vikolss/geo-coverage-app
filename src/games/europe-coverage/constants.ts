import type {
  DifficultyOption,
  PopulationFilterOption,
  RegionKey,
  RegionOption
} from "@/games/europe-coverage/types";

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { key: "easy", label: "Easy (1000 km)", radiusKm: 1000 },
  { key: "medium", label: "Medium (500 km)", radiusKm: 500 },
  { key: "hard", label: "Hard (200 km)", radiusKm: 200 },
  { key: "expert", label: "Expert (50 km)", radiusKm: 50 }
];

export const DEFAULT_DIFFICULTY = DIFFICULTY_OPTIONS[0];

export const REGION_OPTIONS: RegionOption[] = [
  { key: "europe", label: "Europe" },
  { key: "us", label: "United States" },
  { key: "canada", label: "Canada" },
  { key: "asia", label: "Asia & Middle East" },
  { key: "africa", label: "Africa" },
  { key: "southAmerica", label: "South America" },
  { key: "centralAmerica", label: "Central America & Caribbean" },
  { key: "oceania", label: "Oceania" },
  { key: "world", label: "World" }
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
    // Data extent: N 70.66, S 27.76, W -27.22, E 44.99
    center: { lat: 52.0, lng: 12.0 },
    bounds: { north: 72.0, south: 27.0, west: -28.0, east: 46.0 },
    minZoom: 3,
    maxZoom: 8,
    defaultZoom: 4
  },
  us: {
    // Data extent: N 64.84, S 19.59, W -159.35, E -68.70
    center: { lat: 39.8, lng: -98.6 },
    bounds: { north: 68.0, south: 18.0, west: -162.0, east: -65.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 3
  },
  canada: {
    // Data extent: N 62.45, S 42.05, W -135.05, E -52.71
    center: { lat: 60.0, lng: -96.0 },
    bounds: { north: 70.0, south: 41.0, west: -145.0, east: -51.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 3
  },
  asia: {
    // Data extent: N 54.87, S -10.17, W 34.24, E 145.57
    center: { lat: 25.0, lng: 90.0 },
    bounds: { north: 75.0, south: -15.0, west: 30.0, east: 155.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 3
  },
  africa: {
    // Data extent: N 37.27, S -34.58, W -25.06, E 57.75
    center: { lat: 5.0, lng: 17.0 },
    bounds: { north: 38.0, south: -36.0, west: -26.0, east: 59.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 3
  },
  southAmerica: {
    // Data extent: N 12.58, S -54.81, W -90.31, E -34.81
    center: { lat: -15.0, lng: -62.0 },
    bounds: { north: 14.0, south: -57.0, west: -92.0, east: -33.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 3
  },
  centralAmerica: {
    // Data extent: N 32.63, S 7.96, W -117.05, E -59.62
    center: { lat: 20.0, lng: -90.0 },
    bounds: { north: 34.0, south: 7.0, west: -118.5, east: -58.0 },
    minZoom: 3,
    maxZoom: 8,
    defaultZoom: 4
  },
  oceania: {
    // Data extent: N 15.21, S -46.40, W -175.20, E 179.36
    // W bound crosses the dateline; strictBounds: false lets users pan there
    center: { lat: -25.0, lng: 135.0 },
    bounds: { north: 17.0, south: -48.0, west: 110.0, east: 180.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 3
  },
  world: {
    center: { lat: 20.0, lng: 0.0 },
    bounds: { north: 85.0, south: -85.0, west: -180.0, east: 180.0 },
    minZoom: 2,
    maxZoom: 8,
    defaultZoom: 2
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
