import { EuropeMap } from "@/games/europe-coverage/components/EuropeMap";
import type { RegionKey } from "@/games/europe-coverage/types";
import { useEuropeCoverageGame } from "@/games/europe-coverage/useEuropeCoverageGame";

interface CityCoverageGameProps {
  region: RegionKey;
}

function CityCoverageGame({ region }: CityCoverageGameProps) {
  const {
    state,
    guessedCities,
    coveredCities,
    completedCountryCodes,
    countryCoverage,
    populationOptions,
    difficultyOptions,
    radiusKm,
    totalCities,
    coveredCount,
    coveragePercent,
    startGame,
    stopGame,
    updateInput,
    updateDifficulty,
    updateMinPopulation,
    submitGuess
  } = useEuropeCoverageGame(region);

  const recentGuesses = state.guessHistory.slice(0, 5);

  return (
    <section className="game-grid">
      <aside className="card panel">
        <div className="actions-row">
          {!state.isActive ? (
            <button className="button" type="button" onClick={startGame}>
              Start Game
            </button>
          ) : (
            <button className="button button-muted" type="button" onClick={stopGame}>
              Stop Game
            </button>
          )}
        </div>

        <div className="difficulty-block">
          <label htmlFor="difficulty-select">Difficulty</label>
          <select
            id="difficulty-select"
            value={state.difficulty}
            disabled={state.isActive}
            onChange={(event) => updateDifficulty(event.target.value as typeof state.difficulty)}
          >
            {difficultyOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="difficulty-block">
          <label htmlFor="min-population-select">Minimum Population</label>
          <select
            id="min-population-select"
            value={state.selectedMinPopulation}
            disabled={state.isActive}
            onChange={(event) => updateMinPopulation(Number(event.target.value))}
          >
            {populationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">Radius</span>
            <strong>{radiusKm} km</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Coverage</span>
            <strong>{coveragePercent.toFixed(2)}%</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Cities Covered</span>
            <strong>
              {coveredCount} / {totalCities}
            </strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Cities Entered</span>
            <strong>{state.guessedCityIds.length}</strong>
          </div>
        </div>

        <form
          className="guess-form"
          onSubmit={(event) => {
            event.preventDefault();
            submitGuess();
          }}
        >
          <label htmlFor="city-input">City Name</label>
          <input
            id="city-input"
            value={state.inputValue}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Try Paris, Berlin, Madrid..."
            disabled={!state.isActive}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="button" type="submit" disabled={!state.isActive}>
            Submit
          </button>
        </form>

        <p className="status-message">{state.statusMessage}</p>

        {state.isWon ? <p className="win-banner">All cities covered.</p> : null}

        <section className="history-block">
          <h3>Recent Guesses</h3>
          <ul>
            {recentGuesses.map((entry) => (
              <li key={entry.cityId}>
                <span>{entry.cityName}</span>
                <span>
                  +{entry.newlyCoveredCount} ({entry.coveredAfterGuess}/{totalCities})
                </span>
              </li>
            ))}
            {recentGuesses.length === 0 ? (
              <li className="empty-history">No guesses yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="country-block">
          <h3>Country/State Completion</h3>
          <ul>
            {countryCoverage.map((country) => (
              <li key={country.countryCode} className={country.isComplete ? "country-complete" : ""}>
                <span>{country.countryName}</span>
                <span>
                  {country.coveredCities}/{country.totalCities}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </aside>

      <div className="card map-card">
        <EuropeMap
          region={region}
          guessedCities={guessedCities}
          coveredCities={coveredCities}
          completedCountryCodes={completedCountryCodes}
          radiusKm={radiusKm}
        />
      </div>
    </section>
  );
}

export function CityCoverageEuropeGame() {
  return <CityCoverageGame region="europe" />;
}

export function CityCoverageUSGame() {
  return <CityCoverageGame region="us" />;
}
