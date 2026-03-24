import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_DIFFICULTY,
  DEFAULT_POPULATION_FILTER,
  DEFAULT_REGION,
  DIFFICULTY_OPTIONS,
  POPULATION_FILTER_OPTIONS,
  REGION_OPTIONS
} from "@/games/europe-coverage/constants";
import { CityStore } from "@/games/europe-coverage/cityStore";
import type {
  CityRecord,
  CountryCoverage,
  DifficultyKey,
  EuropeCoverageState,
  GuessEntry,
  RegionKey
} from "@/games/europe-coverage/types";

// Each dataset is a separate Vite chunk, loaded on demand when the game is opened.
// Module-level cache ensures each file is fetched at most once per session.
const datasetCache = new Map<RegionKey, CityRecord[]>();

async function loadDataset(region: RegionKey): Promise<CityRecord[]> {
  const cached = datasetCache.get(region);
  if (cached) return cached;

  let mod: { default: unknown };
  switch (region) {
    case "europe":       mod = await import("@/games/europe-coverage/data/europe-cities.json"); break;
    case "us":           mod = await import("@/games/europe-coverage/data/us-cities.json"); break;
    case "canada":       mod = await import("@/games/europe-coverage/data/canada-cities.json"); break;
    case "asia":         mod = await import("@/games/europe-coverage/data/asia-cities.json"); break;
    case "africa":       mod = await import("@/games/europe-coverage/data/africa-cities.json"); break;
    case "southAmerica": mod = await import("@/games/europe-coverage/data/south-america-cities.json"); break;
    case "centralAmerica": mod = await import("@/games/europe-coverage/data/central-america-cities.json"); break;
    case "oceania":      mod = await import("@/games/europe-coverage/data/oceania-cities.json"); break;
    case "world":        mod = await import("@/games/europe-coverage/data/world-cities.json"); break;
  }

  const data = mod.default as CityRecord[];
  datasetCache.set(region, data);
  return data;
}

const INITIAL_STATE: EuropeCoverageState = {
  isActive: false,
  isWon: false,
  inputValue: "",
  statusMessage: "Press start to begin.",
  difficulty: DEFAULT_DIFFICULTY.key,
  selectedRegion: DEFAULT_REGION.key,
  selectedMinPopulation: DEFAULT_POPULATION_FILTER.value,
  activeRegion: DEFAULT_REGION.key,
  activeMinPopulation: DEFAULT_POPULATION_FILTER.value,
  activeRadiusKm: DEFAULT_DIFFICULTY.radiusKm,
  guessedCityIds: [],
  coveredCityIds: [],
  guessHistory: []
};

function getRegionLabel(region: RegionKey): string {
  return REGION_OPTIONS.find((option) => option.key === region)?.label ?? region;
}

function filterCities(cities: CityRecord[], minPopulation: number): CityRecord[] {
  return cities.filter((city) => city.population >= minPopulation);
}

function createInitialState(region: RegionKey): EuropeCoverageState {
  return {
    ...INITIAL_STATE,
    selectedRegion: region,
    activeRegion: region
  };
}

export function useEuropeCoverageGame(region: RegionKey) {
  const [state, setState] = useState<EuropeCoverageState>(() => createInitialState(region));
  const [dataset, setDataset] = useState<CityRecord[] | null>(null);

  useEffect(() => {
    let active = true;
    setDataset(null);
    loadDataset(region).then((data) => {
      if (active) setDataset(data);
    });
    return () => {
      active = false;
    };
  }, [region]);

  const activeCities = useMemo(
    () => (dataset ? filterCities(dataset, state.activeMinPopulation) : []),
    [dataset, state.activeMinPopulation]
  );
  const store = useMemo(() => new CityStore(activeCities), [activeCities]);

  const coveredSet = useMemo(() => new Set(state.coveredCityIds), [state.coveredCityIds]);
  const guessedSet = useMemo(() => new Set(state.guessedCityIds), [state.guessedCityIds]);

  const guessedCities = useMemo(
    () => store.getCitiesByIds(state.guessedCityIds),
    [state.guessedCityIds, store]
  );

  const coveredCities = useMemo(
    () => store.getCitiesByIds(state.coveredCityIds),
    [state.coveredCityIds, store]
  );

  const coveredCount = state.coveredCityIds.length;
  const totalCities = store.totalCities;
  const coveragePercent =
    totalCities === 0 ? 0 : Math.round((coveredCount / totalCities) * 10000) / 100;

  const countryCoverage = useMemo<CountryCoverage[]>(() => {
    return store.countryCodes
      .map((countryCode) => {
        const cityIds = store.getCountryCityIds(countryCode);
        let coveredCitiesCount = 0;

        for (const cityId of cityIds) {
          if (coveredSet.has(cityId)) {
            coveredCitiesCount += 1;
          }
        }

        return {
          countryCode,
          countryName: store.getCountryName(countryCode),
          totalCities: cityIds.length,
          coveredCities: coveredCitiesCount,
          isComplete: cityIds.length > 0 && coveredCitiesCount === cityIds.length
        };
      })
      .sort((a, b) => {
        if (a.isComplete !== b.isComplete) return a.isComplete ? -1 : 1;
        return a.countryName.localeCompare(b.countryName);
      });
  }, [store, coveredSet]);

  const completedCountryCodes = useMemo(
    () =>
      new Set(
        countryCoverage
          .filter((country) => country.isComplete)
          .map((country) => country.countryCode)
      ),
    [countryCoverage]
  );

  function startGame(): void {
    if (!dataset) return;

    const selectedDifficulty =
      DIFFICULTY_OPTIONS.find((option) => option.key === state.difficulty) ??
      DEFAULT_DIFFICULTY;

    const filtered = filterCities(dataset, state.selectedMinPopulation);
    if (filtered.length === 0) {
      setState((previous) => ({
        ...previous,
        statusMessage: "No cities match this region and minimum population."
      }));
      return;
    }

    setState((previous) => ({
      ...INITIAL_STATE,
      isActive: true,
      difficulty: selectedDifficulty.key,
      selectedRegion: region,
      selectedMinPopulation: previous.selectedMinPopulation,
      activeRegion: region,
      activeMinPopulation: previous.selectedMinPopulation,
      activeRadiusKm: selectedDifficulty.radiusKm,
      statusMessage:
        `Game started for ${getRegionLabel(region)} ` +
        `(population >= ${previous.selectedMinPopulation.toLocaleString()}).`
    }));
  }

  function updateInput(value: string): void {
    setState((previous) => ({ ...previous, inputValue: value }));
  }

  function updateDifficulty(difficulty: DifficultyKey): void {
    if (state.isActive) return;

    const selected =
      DIFFICULTY_OPTIONS.find((option) => option.key === difficulty) ??
      DEFAULT_DIFFICULTY;

    setState((previous) => ({
      ...previous,
      difficulty: selected.key,
      activeRadiusKm: selected.radiusKm,
      guessedCityIds: [],
      coveredCityIds: [],
      guessHistory: [],
      isWon: false,
      statusMessage: `Difficulty set to ${selected.label}.`
    }));
  }

  function updateMinPopulation(minPopulation: number): void {
    if (state.isActive) return;

    setState((previous) => ({
      ...previous,
      selectedMinPopulation: minPopulation,
      activeMinPopulation: minPopulation,
      guessedCityIds: [],
      coveredCityIds: [],
      guessHistory: [],
      isWon: false,
      statusMessage: `Minimum population set to ${minPopulation.toLocaleString()}.`
    }));
  }

  function submitGuess(): void {
    if (!dataset) return;

    const city = store.findByName(state.inputValue);
    if (!city) {
      setState((previous) => ({
        ...previous,
        statusMessage: `No city match for "${state.inputValue.trim()}".`
      }));
      return;
    }

    // When the game isn't active, auto-start a fresh game before processing the guess.
    const isAutoStarting = !state.isActive;
    const effectiveGuessedSet = isAutoStarting ? new Set<number>() : guessedSet;
    const effectiveCoveredSet = isAutoStarting ? new Set<number>() : coveredSet;

    if (effectiveGuessedSet.has(city.id)) {
      setState((previous) => ({
        ...previous,
        statusMessage: `${city.name} was already entered.`
      }));
      return;
    }

    const newlyCovered = store
      .findWithinRadius(city, state.activeRadiusKm)
      .filter((coveredCity) => !effectiveCoveredSet.has(coveredCity.id));

    const nextCoveredSet = new Set<number>(effectiveCoveredSet);
    for (const coveredCity of newlyCovered) {
      nextCoveredSet.add(coveredCity.id);
    }

    const nextCoveredIds = Array.from(nextCoveredSet);
    const nextGuessedIds = [...Array.from(effectiveGuessedSet), city.id];
    const isWon = nextCoveredIds.length === totalCities;

    const nextHistoryEntry: GuessEntry = {
      cityId: city.id,
      cityName: city.name,
      newlyCoveredCount: newlyCovered.length,
      coveredAfterGuess: nextCoveredIds.length
    };

    setState((previous) => ({
      ...INITIAL_STATE,
      isActive: true,
      difficulty: previous.difficulty,
      selectedRegion: region,
      selectedMinPopulation: previous.selectedMinPopulation,
      activeRegion: region,
      activeMinPopulation: previous.selectedMinPopulation,
      activeRadiusKm: previous.activeRadiusKm,
      guessedCityIds: nextGuessedIds,
      coveredCityIds: nextCoveredIds,
      guessHistory: [nextHistoryEntry, ...(isAutoStarting ? [] : previous.guessHistory)],
      inputValue: "",
      isWon,
      statusMessage: isWon
        ? "All cities are covered. You win."
        : `${city.name}: +${newlyCovered.length} covered (${nextCoveredIds.length}/${totalCities}).`
    }));
  }

  function stopGame(): void {
    setState((previous) => ({
      ...previous,
      isActive: false,
      statusMessage: "Game stopped. You can start a new run anytime."
    }));
  }

  return {
    state,
    isLoadingData: dataset === null,
    guessedCities,
    coveredCities,
    completedCountryCodes,
    countryCoverage,
    populationOptions: POPULATION_FILTER_OPTIONS,
    difficultyOptions: DIFFICULTY_OPTIONS,
    radiusKm: state.activeRadiusKm,
    totalCities,
    coveredCount,
    coveragePercent,
    startGame,
    stopGame,
    updateInput,
    updateDifficulty,
    updateMinPopulation,
    submitGuess
  };
}
