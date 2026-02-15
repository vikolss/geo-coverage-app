import type { CityRecord } from "@/games/europe-coverage/types";
import { haversineKm } from "@/games/europe-coverage/geo";
import { normalizeCityName } from "@/games/europe-coverage/normalize";

const GRID_CELL_DEGREES = 1.5;

function gridKey(lat: number, lon: number): string {
  const latIndex = Math.floor((lat + 90) / GRID_CELL_DEGREES);
  const lonIndex = Math.floor((lon + 180) / GRID_CELL_DEGREES);
  return `${latIndex}:${lonIndex}`;
}

export class CityStore {
  readonly totalCities: number;
  readonly countryCodes: string[];

  private readonly cityById: Map<number, CityRecord>;
  private readonly nameIndex: Map<string, number[]>;
  private readonly gridIndex: Map<string, number[]>;
  private readonly countryIndex: Map<string, number[]>;
  private readonly countryNameFormatter: Intl.DisplayNames;

  constructor(cities: CityRecord[]) {
    this.totalCities = cities.length;
    this.cityById = new Map();
    this.nameIndex = new Map();
    this.gridIndex = new Map();
    this.countryIndex = new Map();
    this.countryNameFormatter = new Intl.DisplayNames(["en"], { type: "region" });

    for (const city of cities) {
      this.cityById.set(city.id, city);

      const aliases = new Set<string>([
        city.name,
        city.asciiName,
        ...(city.aliases ?? [])
      ]);

      for (const rawAlias of aliases) {
        const normalized = normalizeCityName(rawAlias);
        if (!normalized) continue;

        const existing = this.nameIndex.get(normalized) ?? [];
        existing.push(city.id);
        this.nameIndex.set(normalized, existing);
      }

      const key = gridKey(city.latitude, city.longitude);
      const bucket = this.gridIndex.get(key) ?? [];
      bucket.push(city.id);
      this.gridIndex.set(key, bucket);

      const countryBucket = this.countryIndex.get(city.countryCode) ?? [];
      countryBucket.push(city.id);
      this.countryIndex.set(city.countryCode, countryBucket);
    }

    for (const ids of this.nameIndex.values()) {
      ids.sort((a, b) => {
        const popA = this.cityById.get(a)?.population ?? 0;
        const popB = this.cityById.get(b)?.population ?? 0;
        return popB - popA;
      });
    }

    this.countryCodes = Array.from(this.countryIndex.keys()).sort((a, b) =>
      this.getCountryName(a).localeCompare(this.getCountryName(b))
    );
  }

  findByName(nameInput: string): CityRecord | undefined {
    const normalized = normalizeCityName(nameInput);
    if (!normalized) return undefined;

    const cityIds = this.nameIndex.get(normalized);
    if (!cityIds || cityIds.length === 0) return undefined;

    const chosenId = cityIds[0];
    return this.cityById.get(chosenId);
  }

  getCitiesByIds(cityIds: Iterable<number>): CityRecord[] {
    const cities: CityRecord[] = [];
    for (const id of cityIds) {
      const city = this.cityById.get(id);
      if (city) cities.push(city);
    }
    return cities;
  }

  getCityById(id: number): CityRecord | undefined {
    return this.cityById.get(id);
  }

  getCountryName(countryCode: string): string {
    // US dataset uses state names as "countryCode"; Intl region formatter only accepts valid region codes.
    if (!/^[A-Z]{2,3}$/.test(countryCode)) {
      return countryCode;
    }

    try {
      return this.countryNameFormatter.of(countryCode) ?? countryCode;
    } catch {
      return countryCode;
    }
  }

  getCountryCityIds(countryCode: string): number[] {
    return this.countryIndex.get(countryCode) ?? [];
  }

  findWithinRadius(center: CityRecord, radiusKm: number): CityRecord[] {
    const latDelta = radiusKm / 111;
    const cosLat = Math.max(0.2, Math.cos((center.latitude * Math.PI) / 180));
    const lonDelta = radiusKm / (111 * cosLat);

    const minLat = center.latitude - latDelta;
    const maxLat = center.latitude + latDelta;
    const minLon = center.longitude - lonDelta;
    const maxLon = center.longitude + lonDelta;

    const minLatIndex = Math.floor((minLat + 90) / GRID_CELL_DEGREES);
    const maxLatIndex = Math.floor((maxLat + 90) / GRID_CELL_DEGREES);
    const minLonIndex = Math.floor((minLon + 180) / GRID_CELL_DEGREES);
    const maxLonIndex = Math.floor((maxLon + 180) / GRID_CELL_DEGREES);

    const candidateIds = new Set<number>();

    for (let latIndex = minLatIndex; latIndex <= maxLatIndex; latIndex += 1) {
      for (let lonIndex = minLonIndex; lonIndex <= maxLonIndex; lonIndex += 1) {
        const bucket = this.gridIndex.get(`${latIndex}:${lonIndex}`);
        if (!bucket) continue;

        for (const cityId of bucket) {
          candidateIds.add(cityId);
        }
      }
    }

    const covered: CityRecord[] = [];
    for (const cityId of candidateIds) {
      const city = this.cityById.get(cityId);
      if (!city) continue;

      const distance = haversineKm(
        center.latitude,
        center.longitude,
        city.latitude,
        city.longitude
      );

      if (distance <= radiusKm) {
        covered.push(city);
      }
    }

    return covered;
  }
}
