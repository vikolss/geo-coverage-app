import { EuropeMap } from "@/games/europe-coverage/components/EuropeMap";
import type { RegionKey } from "@/games/europe-coverage/types";
import { useEuropeCoverageGame } from "@/games/europe-coverage/useEuropeCoverageGame";

interface CityCoverageGameProps {
  region: RegionKey;
}

function CityCoverageGame({ region }: CityCoverageGameProps) {
  const {
    state,
    isLoadingData,
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

  const difficultyLabel =
    difficultyOptions.find((o) => o.key === state.difficulty)?.label ?? state.difficulty;
  const populationLabel =
    populationOptions.find((o) => o.value === state.selectedMinPopulation)?.label ?? "";

  return (
    <section className={`game-grid ${state.isActive ? "game-grid--active" : "game-grid--setup"}`}>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      {/* Desktop: right column. Mobile active: reordered to top via CSS.   */}
      {/* Mobile pre-game: hidden via CSS.                                   */}
      <div className="card map-card">
        <EuropeMap
          region={region}
          guessedCities={guessedCities}
          coveredCities={coveredCities}
          completedCountryCodes={completedCountryCodes}
          radiusKm={radiusKm}
        />
      </div>

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <aside className="card panel">

        {/* Settings section                                                 */}
        {/* Desktop: always visible. Mobile: only visible pre-game.         */}
        <div className="settings-section">
          <div className="difficulty-block">
            <label htmlFor="difficulty-select">Difficulty</label>
            <select
              id="difficulty-select"
              value={state.difficulty}
              disabled={state.isActive}
              onChange={(e) => updateDifficulty(e.target.value as typeof state.difficulty)}
            >
              {difficultyOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="difficulty-block">
            <label htmlFor="min-population-select">Minimum Population</label>
            <select
              id="min-population-select"
              value={state.selectedMinPopulation}
              disabled={state.isActive}
              onChange={(e) => updateMinPopulation(Number(e.target.value))}
            >
              {populationOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Start button — desktop: inside settings section area.           */}
        {/* Mobile pre-game: shown below settings.                          */}
        {/* Mobile active: hidden (stop is in compact-settings row).        */}
        <div className="actions-row start-action">
          <button
            className="button"
            type="button"
            onClick={startGame}
            disabled={isLoadingData}
          >
            {isLoadingData ? "Loading data…" : "Start Game"}
          </button>
        </div>

        {/* Compact settings row — mobile active only.                      */}
        {/* Shows minimized settings summary + stop button.                 */}
        <div className="compact-settings">
          <span className="compact-settings-label">
            {difficultyLabel} · {radiusKm} km · min {populationLabel}
          </span>
          <button className="button button-muted button-sm" type="button" onClick={stopGame}>
            Stop
          </button>
        </div>

        {/* Guess form */}
        <form
          className="guess-form"
          onSubmit={(e) => { e.preventDefault(); submitGuess(); }}
        >
          <label htmlFor="city-input">City Name</label>
          <input
            id="city-input"
            value={state.inputValue}
            onChange={(e) => updateInput(e.target.value)}
            placeholder="Try Paris, Berlin, Madrid…"
            autoComplete="off"
            spellCheck={false}
          />
          <button className="button" type="submit" disabled={isLoadingData}>
            Submit
          </button>
        </form>

        <p className="status-message">{state.statusMessage}</p>

        {state.isWon ? <p className="win-banner">All cities covered.</p> : null}

        {/* Stats — desktop: always shown. Mobile: only when active.        */}
        <div className="stats-grid active-only">
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
            <strong>{coveredCount} / {totalCities}</strong>
          </div>
          <div className="stat-box">
            <span className="stat-label">Cities Entered</span>
            <strong>{state.guessedCityIds.length}</strong>
          </div>
        </div>

        {/* Stop button — desktop sidebar. Mobile: hidden (in compact row). */}
        <div className="actions-row stop-action">
          <button className="button button-muted" type="button" onClick={stopGame}>
            Stop Game
          </button>
        </div>

        {/* History and countries — scrollable on mobile. */}
        <div className="panel-scroll-section">
          <section className="history-block">
            <h3>Recent Guesses</h3>
            <ul>
              {recentGuesses.map((entry) => (
                <li key={entry.cityId}>
                  <span>{entry.cityName}</span>
                  <span>+{entry.newlyCoveredCount} ({entry.coveredAfterGuess}/{totalCities})</span>
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
                <li
                  key={country.countryCode}
                  className={country.isComplete ? "country-complete" : ""}
                >
                  <span>{country.countryName}</span>
                  <span>{country.coveredCities}/{country.totalCities}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

      </aside>
    </section>
  );
}

export function CityCoverageEuropeGame() {
  return <CityCoverageGame region="europe" />;
}

export function CityCoverageUSGame() {
  return <CityCoverageGame region="us" />;
}

export function CityCoverageCanadaGame() {
  return <CityCoverageGame region="canada" />;
}

export function CityCoverageAsiaGame() {
  return <CityCoverageGame region="asia" />;
}

export function CityCoverageAfricaGame() {
  return <CityCoverageGame region="africa" />;
}

export function CityCoverageSouthAmericaGame() {
  return <CityCoverageGame region="southAmerica" />;
}

export function CityCoverageCentralAmericaGame() {
  return <CityCoverageGame region="centralAmerica" />;
}

export function CityCoverageOceaniaGame() {
  return <CityCoverageGame region="oceania" />;
}

export function CityCoverageWorldGame() {
  return <CityCoverageGame region="world" />;
}
