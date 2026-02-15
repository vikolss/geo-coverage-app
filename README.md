# GeoCover

Web app for map-coverage geography games, structured to support multiple sub-games.

## Current game

- Region options: Europe or United States
- Guess a city name in the selected region.
- A coverage circle (difficulty-based radius) is drawn for guessed cities.
- Any city within that radius counts as covered.
- Goal: cover all cities in the dataset.
- Minimum population filter options: `10k`, `25k`, `100k`, `500k`

## Setup

```bash
npm install
npm run data:build
npm run dev
```

## Environment variables

In `.env`:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_key
```

This project also accepts `GOOGLE_MAPS_API_KEY` for compatibility with your existing file.

## Dataset

`npm run data:build` downloads `cities5000.zip` from GeoNames and builds:

- `src/games/europe-coverage/data/europe-cities-geonames.json`

Current filtering:

- populated places (`featureClass=P`)
- population >= 10,000
- European country code whitelist
- geographic bounds for Europe (`lat: 27..72.5`, `lon: -31..45`)

Data source: https://www.geonames.org/

US dataset source file:

- `data/archive/us2021census.csv`
