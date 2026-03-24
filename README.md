# GeoCover

Web and Android app for map-coverage geography games, structured to support multiple sub-games.

## Game

- Region options: Europe or United States
- Guess a city name in the selected region
- A coverage circle (difficulty-based radius) is drawn for each correct guess
- Any city within that radius counts as covered
- Goal: cover all cities in the dataset

**Difficulty** (coverage radius): Easy 500km · Medium 200km · Hard 100km · Expert 50km

**Population filter**: 10k · 25k · 100k · 500k minimum

## Prerequisites

- Node.js >= 22 (Capacitor requirement). If using nvm: `nvm install 22 && nvm alias default 22`
- A Google Maps API key (see Environment variables below)
- For Android builds: Android Studio

## Setup

```bash
npm install
npm run data:build   # downloads GeoNames data and builds city JSON files
```

## Environment variables

Create a `.env` file in the project root:

```bash
GOOGLE_MAPS_API_KEY=your_web_key
GOOGLE_MAPS_API_KEY_ANDROID=your_android_key   # used for Android builds
```

The two keys can be the same key if unrestricted. Separate keys are useful if you want
to add platform-specific restrictions in the Google Cloud Console later (HTTP referrers
for web, app package + SHA-1 for Android).

## Running and building

### Web (development)

```bash
npm run dev
```

### Web (production build)

```bash
npm run build
```

Output goes to `dist/`.

### Android

The Android app is built with [Capacitor](https://capacitorjs.com), which wraps the web
app in a native Android WebView.

**Build and sync web assets to the Android project:**

```bash
npm run build:android && npx cap sync
```

**Open in Android Studio** (to run on emulator or device, or to produce an APK/AAB):

```bash
npx cap open android
```

Do this after every code change: `npm run build:android && npx cap sync`, then rebuild
in Android Studio.

## Dataset

`npm run data:build` downloads `cities5000.zip` from GeoNames and builds:

- `src/games/europe-coverage/data/europe-cities-geonames.json`

Filtering applied:
- Populated places (`featureClass=P`)
- Population >= 10,000
- European country code whitelist
- Geographic bounds (`lat: 27–72.5`, `lon: -31–45`)

US data source: `data/archive/us2021census.csv` (2021 Census)

Data sources: https://www.geonames.org/
