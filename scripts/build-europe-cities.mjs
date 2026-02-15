import fs from "node:fs";
import https from "node:https";
import { spawn } from "node:child_process";
import readline from "node:readline";
import path from "node:path";
import process from "node:process";

const ZIP_URL = "https://download.geonames.org/export/dump/cities5000.zip";
const ZIP_PATH = path.join(process.cwd(), "data", "cities5000.zip");
const OUTPUT_PATH = path.join(
  process.cwd(),
  "src",
  "games",
  "europe-coverage",
  "data",
  "europe-cities-geonames.json"
);

const MIN_POPULATION = 10000;

const EUROPE_COUNTRY_CODES = new Set([
  "AD",
  "AL",
  "AT",
  "AX",
  "BA",
  "BE",
  "BG",
  "BY",
  "CH",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FO",
  "FR",
  "GB",
  "GG",
  "GI",
  "GR",
  "HR",
  "HU",
  "IE",
  "IM",
  "IS",
  "IT",
  "JE",
  "LI",
  "LT",
  "LU",
  "LV",
  "MC",
  "MD",
  "ME",
  "MK",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "RS",
  "RU",
  "SE",
  "SI",
  "SJ",
  "SK",
  "SM",
  "TR",
  "UA",
  "VA",
  "XK"
]);

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    https
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => resolve());
        });
      })
      .on("error", (error) => {
        fs.rmSync(destination, { force: true });
        reject(error);
      });
  });
}

function withinEuropeBounds(latitude, longitude) {
  return (
    latitude >= 27 &&
    latitude <= 72.5 &&
    longitude >= -31 &&
    longitude <= 45
  );
}

function uniqueAliases(name, asciiName, alternateNamesRaw) {
  const aliases = new Set();

  for (const candidate of [name, asciiName, ...alternateNamesRaw.split(",")]) {
    const value = candidate.trim();
    if (!value) continue;
    if (value.length > 80) continue;
    aliases.add(value);
    if (aliases.size >= 24) break;
  }

  aliases.delete(name);
  aliases.delete(asciiName);

  return Array.from(aliases);
}

async function buildDataset() {
  ensureDirectory(path.dirname(ZIP_PATH));
  ensureDirectory(path.dirname(OUTPUT_PATH));

  if (!fs.existsSync(ZIP_PATH)) {
    console.log(`Downloading ${ZIP_URL}`);
    await downloadFile(ZIP_URL, ZIP_PATH);
  }

  const unzip = spawn("unzip", ["-p", ZIP_PATH, "cities5000.txt"], {
    stdio: ["ignore", "pipe", "inherit"]
  });

  const lineReader = readline.createInterface({
    input: unzip.stdout,
    crlfDelay: Infinity
  });

  /** @type {Array<{
   * id:number,
   * name:string,
   * asciiName:string,
   * latitude:number,
   * longitude:number,
   * population:number,
   * countryCode:string,
   * aliases:string[]
   * }>} */
  const rows = [];

  for await (const line of lineReader) {
    const columns = line.split("\t");
    if (columns.length < 19) continue;

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
    ] = columns;

    if (featureClass !== "P") continue;
    if (!EUROPE_COUNTRY_CODES.has(countryCode)) continue;

    const population = Number.parseInt(populationRaw, 10);
    if (!Number.isFinite(population) || population < MIN_POPULATION) continue;

    const latitude = Number.parseFloat(latitudeRaw);
    const longitude = Number.parseFloat(longitudeRaw);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    if (!withinEuropeBounds(latitude, longitude)) continue;

    rows.push({
      id: Number.parseInt(geonameId, 10),
      name,
      asciiName,
      latitude,
      longitude,
      population,
      countryCode,
      aliases: uniqueAliases(name, asciiName, alternateNames)
    });
  }

  await new Promise((resolve, reject) => {
    unzip.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`unzip exited with code ${code}`));
      }
    });
  });

  rows.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(rows));
  console.log(`Wrote ${rows.length} cities to ${OUTPUT_PATH}`);
}

buildDataset().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
