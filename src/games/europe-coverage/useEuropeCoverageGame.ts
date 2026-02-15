import { useMemo, useState } from "react";
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
import europeDataset from "@/games/europe-coverage/data/europe-cities-geonames.json";
import usDataset from "@/games/europe-coverage/data/us-cities-census.json";

const DATASETS: Record<RegionKey, CityRecord[]> = {
  europe: europeDataset as CityRecord[],
  us: usDataset as CityRecord[]
};

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

function filterCities(region: RegionKey, minPopulation: number): CityRecord[] {
  return DATASETS[region].filter((city) => city.population >= minPopulation);
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

  const activeCities = useMemo(
    () => filterCities(state.activeRegion, state.activeMinPopulation),
    [state.activeRegion, state.activeMinPopulation]
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
    const selectedDifficulty =
      DIFFICULTY_OPTIONS.find((option) => option.key === state.difficulty) ??
      DEFAULT_DIFFICULTY;

    const filtered = filterCities(region, state.selectedMinPopulation);
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
    if (!state.isActive) {
      setState((previous) => ({
        ...previous,
        statusMessage: "Start a game first."
      }));
      return;
    }

    const city = store.findByName(state.inputValue);
    if (!city) {
      setState((previous) => ({
        ...previous,
        statusMessage: `No city match for \"${state.inputValue.trim()}\".`
      }));
      return;
    }

    if (guessedSet.has(city.id)) {
      setState((previous) => ({
        ...previous,
        statusMessage: `${city.name} was already entered.`
      }));
      return;
    }

    const newlyCovered = store
      .findWithinRadius(city, state.activeRadiusKm)
      .filter((coveredCity) => !coveredSet.has(coveredCity.id));

    const nextCoveredSet = new Set<number>(coveredSet);
    for (const coveredCity of newlyCovered) {
      nextCoveredSet.add(coveredCity.id);
    }

    const nextCoveredIds = Array.from(nextCoveredSet);
    const nextGuessedIds = [...state.guessedCityIds, city.id];
    const isWon = nextCoveredIds.length === totalCities;

    const nextHistoryEntry: GuessEntry = {
      cityId: city.id,
      cityName: city.name,
      newlyCoveredCount: newlyCovered.length,
      coveredAfterGuess: nextCoveredIds.length
    };

    setState((previous) => ({
      ...previous,
      guessedCityIds: nextGuessedIds,
      coveredCityIds: nextCoveredIds,
      guessHistory: [nextHistoryEntry, ...previous.guessHistory],
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
