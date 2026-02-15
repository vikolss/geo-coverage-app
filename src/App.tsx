import { useMemo, useState } from "react";
import { SUB_GAMES } from "@/games/registry";

function App() {
  const [activeGameId, setActiveGameId] = useState(SUB_GAMES[0]?.id ?? "");

  const activeGame = useMemo(
    () => SUB_GAMES.find((game) => game.id === activeGameId) ?? SUB_GAMES[0],
    [activeGameId]
  );

  if (!activeGame) {
    return (
      <main className="app-shell">
        <div className="card">
          <h1>GeoCover</h1>
          <p>No game is configured yet.</p>
        </div>
      </main>
    );
  }

  const ActiveGameComponent = activeGame.component;

  return (
    <main className="app-shell">
      <header className="topbar card">
        <div>
          <h1>GeoCover</h1>
          <p className="subtitle">Name cities to expand your coverage circles.</p>
        </div>
        <label className="game-select-label" htmlFor="sub-game-select">
          Game Mode
          <select
            id="sub-game-select"
            value={activeGameId}
            onChange={(event) => setActiveGameId(event.target.value)}
          >
            {SUB_GAMES.map((game) => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="game-description card">
        <h2>{activeGame.title}</h2>
        <p>{activeGame.description}</p>
      </section>

      <ActiveGameComponent />
    </main>
  );
}

export default App;
