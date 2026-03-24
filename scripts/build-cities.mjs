/**
 * Downloads cities5000.zip from GeoNames (once) and the US Census CSV,
 * then builds one JSON file per region into src/games/europe-coverage/data/.
 *
 * Usage:  node scripts/build-cities.mjs
 */

import fs from "node:fs";
import https from "node:https";
import { spawn } from "node:child_process";
import readline from "node:readline";
import path from "node:path";
import process from "node:process";

const GEONAMES_URL = "https://download.geonames.org/export/dump/cities5000.zip";
const ZIP_PATH = path.join(process.cwd(), "data", "cities5000.zip");
const DATA_OUT = path.join(process.cwd(), "src", "games", "europe-coverage", "data");
const CENSUS_CSV = path.join(process.cwd(), "data", "archive", "us2021census.csv");

const MIN_POPULATION = 10_000;

// ---------------------------------------------------------------------------
// Country-code sets per region
// ---------------------------------------------------------------------------

const EUROPE_CODES = new Set([
  "AD", "AL", "AT", "AX", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE",
  "DK", "EE", "ES", "FI", "FO", "FR", "GB", "GG", "GI", "GR", "HR", "HU",
  "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME",
  "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SJ",
  "SK", "SM", "TR", "UA", "VA", "XK"
]);

// All of Asia including Middle East / Western Asia (excludes Russia)
const ASIA_CODES = new Set([
  // East Asia
  "CN", "HK", "JP", "KP", "KR", "MN", "MO", "TW",
  // Southeast Asia
  "BN", "ID", "KH", "LA", "MM", "MY", "PH", "SG", "TH", "TL", "VN",
  // South Asia
  "AF", "BD", "BT", "IN", "LK", "MV", "NP", "PK",
  // Central Asia
  "KG", "KZ", "TJ", "TM", "UZ",
  // Western Asia / Middle East + South Caucasus
  "AE", "AM", "AZ", "BH", "GE", "IL", "IQ", "IR", "JO",
  "KW", "LB", "OM", "PS", "QA", "SA", "SY", "YE"
]);

const AFRICA_CODES = new Set([
  "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ",
  "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE",
  "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA",
  "NE", "NG", "RE", "RW", "SC", "SD", "SH", "SL", "SN", "SO", "SS", "ST",
  "SZ", "TD", "TG", "TN", "TZ", "UG", "YT", "ZA", "ZM", "ZW"
]);

const SOUTH_AMERICA_CODES = new Set([
  "AR", "BO", "BR", "CL", "CO", "EC", "FK", "GF", "GY", "PE", "PY", "SR", "UY", "VE"
]);

// Mexico, Central America and the Caribbean
const CENTRAL_AMERICA_CODES = new Set([
  "AG", "AI", "AW", "BB", "BL", "BQ", "BS", "BZ", "CR", "CU", "CW", "DM",
  "DO", "GD", "GP", "GT", "HN", "HT", "JM", "KN", "KY", "LC", "MF", "MQ",
  "MS", "MX", "NI", "PA", "PR", "SV", "SX", "TC", "TT", "VC", "VG", "VI"
]);

const OCEANIA_CODES = new Set([
  "AS", "AU", "CK", "FJ", "FM", "GU", "KI", "MH", "MP", "NC",
  "NR", "NU", "NZ", "PF", "PG", "PW", "SB", "TK", "TO", "TV", "VU", "WF", "WS"
]);

// ---------------------------------------------------------------------------
// GeoNames region definitions
// Europe uses geographic bounds to exclude Asian Russia.
// All other regions use country codes only.
// ---------------------------------------------------------------------------

const GEONAMES_REGIONS = [
  {
    key: "europe",
    outputName: "europe-cities.json",
    codes: EUROPE_CODES,
    bounds: { minLat: 27, maxLat: 72.5, minLon: -31, maxLon: 45 }
  },
  {
    key: "canada",
    outputName: "canada-cities.json",
    codes: new Set(["CA"]),
    bounds: null
  },
  {
    key: "asia",
    outputName: "asia-cities.json",
    codes: ASIA_CODES,
    bounds: null
  },
  {
    key: "africa",
    outputName: "africa-cities.json",
    codes: AFRICA_CODES,
    bounds: null
  },
  {
    key: "southAmerica",
    outputName: "south-america-cities.json",
    codes: SOUTH_AMERICA_CODES,
    bounds: null
  },
  {
    key: "centralAmerica",
    outputName: "central-america-cities.json",
    codes: CENTRAL_AMERICA_CODES,
    bounds: null
  },
  {
    key: "oceania",
    outputName: "oceania-cities.json",
    codes: OCEANIA_CODES,
    bounds: null
  },
  {
    key: "world",
    outputName: "world-cities.json",
    codes: null, // null = no country filter, include everything
    bounds: null
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    https
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`Download failed: HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => file.close(() => resolve()));
      })
      .on("error", (err) => {
        fs.rmSync(destination, { force: true });
        reject(err);
      });
  });
}

function withinBounds(lat, lon, bounds) {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lon >= bounds.minLon &&
    lon <= bounds.maxLon
  );
}

function uniqueAliases(name, asciiName, alternateNamesRaw) {
  const aliases = new Set();
  for (const candidate of [name, asciiName, ...alternateNamesRaw.split(",")]) {
    const value = candidate.trim();
    if (!value || value.length > 80) continue;
    aliases.add(value);
    if (aliases.size >= 24) break;
  }
  aliases.delete(name);
  aliases.delete(asciiName);
  return Array.from(aliases);
}

function writeRegionFile(outputName, rows) {
  rows.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name));
  const outputPath = path.join(DATA_OUT, outputName);
  fs.writeFileSync(outputPath, JSON.stringify(rows));
  console.log(`  ${outputName}: ${rows.length} cities`);
}

// ---------------------------------------------------------------------------
// GeoNames processing (single pass, all regions)
// ---------------------------------------------------------------------------

async function buildGeonamesRegions() {
  ensureDir(path.dirname(ZIP_PATH));
  ensureDir(DATA_OUT);

  if (!fs.existsSync(ZIP_PATH)) {
    console.log(`Downloading ${GEONAMES_URL} ...`);
    await downloadFile(GEONAMES_URL, ZIP_PATH);
    console.log("Download complete.");
  } else {
    console.log("Using cached cities5000.zip");
  }

  // Buckets: one array per region
  const buckets = Object.fromEntries(GEONAMES_REGIONS.map((r) => [r.key, []]));

  const unzip = spawn("unzip", ["-p", ZIP_PATH, "cities5000.txt"], {
    stdio: ["ignore", "pipe", "inherit"]
  });

  const lineReader = readline.createInterface({
    input: unzip.stdout,
    crlfDelay: Infinity
  });

  for await (const line of lineReader) {
    const cols = line.split("\t");
    if (cols.length < 19) continue;

    const [
      geonameId,
      name,
      asciiName,
      alternateNames,
      latitudeRaw,
      longitudeRaw,
      featureClass,
      ,
      countryCode,
      ,
      ,
      ,
      ,
      ,
      populationRaw
    ] = cols;

    if (featureClass !== "P") continue;

    const population = Number.parseInt(populationRaw, 10);
    if (!Number.isFinite(population) || population < MIN_POPULATION) continue;

    const latitude = Number.parseFloat(latitudeRaw);
    const longitude = Number.parseFloat(longitudeRaw);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const city = {
      id: Number.parseInt(geonameId, 10),
      name,
      asciiName,
      latitude,
      longitude,
      population,
      countryCode,
      aliases: uniqueAliases(name, asciiName, alternateNames)
    };

    for (const region of GEONAMES_REGIONS) {
      if (region.codes !== null && !region.codes.has(countryCode)) continue;
      if (region.bounds && !withinBounds(latitude, longitude, region.bounds)) continue;
      buckets[region.key].push(city);
    }
  }

  await new Promise((resolve, reject) => {
    unzip.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`unzip exited with code ${code}`));
    });
  });

  console.log("Writing GeoNames region files:");
  for (const region of GEONAMES_REGIONS) {
    writeRegionFile(region.outputName, buckets[region.key]);
  }
}

// ---------------------------------------------------------------------------
// US Census processing
// ---------------------------------------------------------------------------

const US_STATE_ABBR = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "District of Columbia", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  PR: "Puerto Rico", GU: "Guam", VI: "U.S. Virgin Islands", AS: "American Samoa",
  MP: "Northern Mariana Islands"
};

async function buildUsCensus() {
  if (!fs.existsSync(CENSUS_CSV)) {
    console.warn(`  WARNING: ${CENSUS_CSV} not found, skipping US dataset.`);
    return;
  }

  const content = fs.readFileSync(CENSUS_CSV, "utf8");
  const lines = content.split("\n");
  const rows = [];
  let idCounter = 100_000_001;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [city, stateAbbr, , , populationRaw, latRaw, lonRaw] = line.split(",");
    if (!city || !stateAbbr) continue;

    const population = Number.parseInt(populationRaw, 10);
    if (!Number.isFinite(population) || population < MIN_POPULATION) continue;

    const latitude = Number.parseFloat(latRaw);
    const longitude = Number.parseFloat(lonRaw);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const stateName = US_STATE_ABBR[stateAbbr.trim()] ?? stateAbbr.trim();

    rows.push({
      id: idCounter++,
      name: city.trim(),
      asciiName: city.trim(),
      latitude,
      longitude,
      population,
      countryCode: stateName,
      aliases: [
        `${city.trim()}, ${stateAbbr.trim()}`,
        `${city.trim()}, ${stateName}`
      ]
    });
  }

  console.log("Writing US Census region file:");
  writeRegionFile("us-cities.json", rows);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await buildGeonamesRegions();
  await buildUsCensus();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
